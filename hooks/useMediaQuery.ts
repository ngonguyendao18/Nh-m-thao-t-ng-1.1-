import { useState, useEffect } from 'react';

/**
 * A custom React hook to track the state of a CSS media query.
 *
 * @param query The media query string to watch (e.g., '(min-width: 768px)').
 * @returns A boolean indicating whether the media query is currently matched.
 */
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for server-side rendering safety)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    // Update state if the media query match state changes
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Listener function to update state on change
    const listener = () => {
      setMatches(media.matches);
    };

    // Add the listener
    media.addEventListener('change', listener);

    // Cleanup function to remove the listener on component unmount
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;
