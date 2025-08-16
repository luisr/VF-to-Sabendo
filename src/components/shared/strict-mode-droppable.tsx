"use client";
import { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from '@hello-pangea/dnd';

/**
 * This is a wrapper around react-beautiful-dnd's Droppable component.
 * It is designed to fix a known issue where the library is not compatible
 * with React 18's Strict Mode, which is enabled in Next.js development.
 * Strict Mode's double-rendering behavior corrupts the internal state of the
 * library, causing an "Invariant failed: isDropDisabled must be a boolean" error.
 * 
 * This wrapper ensures that the Droppable component is only rendered on the
 * client, after the initial mount, thus bypassing the double-render issue.
 */
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only once on the client, after the initial mount.
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Don't render anything on the server or during the initial client render.
    return null;
  }

  // Once mounted, render the actual Droppable component.
  return <Droppable {...props}>{children}</Droppable>;
};
