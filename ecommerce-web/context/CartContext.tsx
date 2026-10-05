"use client";

import React, { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import { useAuth } from "./AuthContext";
import { Cart } from "@/types/cart";
import { getErrorMessage } from "@/services/api.client";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";

  const {
    data: cart,
    isLoading,
    refetch: refreshCart,
  } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => cartService.getCart(),
    enabled: isCustomer,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartService.addItem({ product_id: productId, quantity }),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart", user?.id], updatedCart);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartService.updateItem(itemId, { quantity }),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(["cart", user?.id], updatedCart);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartService.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => cartService.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });

  const addItem = async (productId: number, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to add items to your cart.");
    }
    if (user?.role === "ADMIN") {
      throw new Error("Admins cannot use the shopping cart.");
    }
    try {
      await addMutation.mutateAsync({ productId, quantity });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    try {
      await updateMutation.mutateAsync({ itemId, quantity });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await removeMutation.mutateAsync(itemId);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const clearCart = async () => {
    try {
      await clearMutation.mutateAsync();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const value: CartContextType = {
    cart: cart || null,
    isLoading: isCustomer && isLoading,
    itemCount: cart?.total_quantity || 0,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart: () => refreshCart(),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
