package slug

import (
	"regexp"
	"strings"
)

var nonAlphaNumRegex = regexp.MustCompile(`[^a-z0-9]+`)

// Make generates a clean URL-friendly slug from a string
func Make(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = nonAlphaNumRegex.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
