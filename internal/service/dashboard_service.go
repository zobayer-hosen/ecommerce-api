package service

import (
	"context"

	"ecommerce-api/internal/dto"
	"ecommerce-api/internal/pkg/apperror"
	"ecommerce-api/internal/repository"
)

type DashboardService interface {
	GetDashboardStats(ctx context.Context) (*dto.DashboardStatsResponse, error)
}

type dashboardService struct {
	dashboardRepo repository.DashboardRepository
}

func NewDashboardService(dashboardRepo repository.DashboardRepository) DashboardService {
	return &dashboardService{dashboardRepo: dashboardRepo}
}

func (s *dashboardService) GetDashboardStats(ctx context.Context) (*dto.DashboardStatsResponse, error) {
	stats, err := s.dashboardRepo.GetStats(ctx, 5) // default threshold 5
	if err != nil {
		return nil, apperror.ErrInternal
	}
	return stats, nil
}
