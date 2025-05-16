import { describe, it, expect } from 'vitest';

// Example utility function to test
const formatCardTitle = (title: string): string => {
  return title.length > 50 ? title.substring(0, 47) + '...' : title;
};

describe('Utility Functions', () => {
  describe('formatCardTitle', () => {
    it('should return the original title if it is less than 50 characters', () => {
      const shortTitle = 'Short Title';
      expect(formatCardTitle(shortTitle)).toBe(shortTitle);
    });

    it('should truncate the title if it is more than 50 characters', () => {
      const longTitle =
        'This is a very long title that should be truncated because it exceeds the maximum length allowed for card titles in our application';
      const truncatedTitle = 'This is a very long title that should be trunca...';
      expect(formatCardTitle(longTitle)).toBe(truncatedTitle);
    });
  });
});
