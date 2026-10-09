import React, { useState, useRef, useEffect } from 'react';
import { AppTileState } from '../types/launcher';
import { AppTile } from './AppTile';

interface AppGridProps {
  apps: AppTileState[];
  selectedIndex: number;
  launchingId: string | null;
  onLaunch: (id: string) => void;
  onConfigure: (app: AppTileState) => void;
  onRemove: (id: string) => void;
  onSelectIndex: (index: number) => void;
  onReorderApps: (sourceId: string, targetId: string) => void;
  onShiftIndex: (index: number, direction: 'prev' | 'next') => void;
}

export const AppGrid: React.FC<AppGridProps> = ({
  apps,
  selectedIndex,
  launchingId,
  onLaunch,
  onConfigure,
  onRemove,
  onSelectIndex,
  onReorderApps,
  onShiftIndex,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [justDraggedId, setJustDraggedId] = useState<string | null>(null);

  const dragSession = useRef<{
    activeId: string | null;
    startX: number;
    startY: number;
    isDragging: boolean;
  }>({
    activeId: null,
    startX: 0,
    startY: 0,
    isDragging: false,
  });

  // Determine optimal column count based on number of apps
  let colClass = 'grid-cols-2';
  if (apps.length >= 7) {
    colClass = 'grid-cols-3 sm:grid-cols-4';
  } else if (apps.length >= 5) {
    colClass = 'grid-cols-3';
  }

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    dragSession.current = {
      activeId: id,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
    };
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const session = dragSession.current;
      if (!session.activeId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!session.isDragging && dist > 6) {
        session.isDragging = true;
        setDraggingId(session.activeId);
      }

      if (session.isDragging) {
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const tileElem = elemUnder?.closest('[data-tile-id]');
        const targetId = tileElem?.getAttribute('data-tile-id') || null;

        if (targetId && targetId !== session.activeId) {
          setDragOverId(targetId);
        } else {
          setDragOverId(null);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const session = dragSession.current;
      if (!session.activeId) return;

      if (session.isDragging) {
        const sourceId = session.activeId;
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const tileElem = elemUnder?.closest('[data-tile-id]');
        const targetId = tileElem?.getAttribute('data-tile-id') || null;

        setJustDraggedId(sourceId);
        setTimeout(() => setJustDraggedId(null), 250);

        if (targetId && targetId !== sourceId) {
          onReorderApps(sourceId, targetId);
        }
      }

      dragSession.current = {
        activeId: null,
        startX: 0,
        startY: 0,
        isDragging: false,
      };
      setDraggingId(null);
      setDragOverId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [onReorderApps]);

  return (
    <div className={`grid ${colClass} gap-2.5 p-3 flex-1 overflow-y-auto w-full transition-all`}>
      {apps.map((app, index) => (
        <AppTile
          key={app.id}
          app={app}
          index={index}
          totalApps={apps.length}
          isSelected={selectedIndex === index}
          isLaunching={launchingId === app.id}
          isDraggingThis={draggingId === app.id}
          isDragOverThis={dragOverId === app.id && draggingId !== app.id}
          wasJustDragged={justDraggedId === app.id}
          onPointerDown={handlePointerDown}
          onLaunch={onLaunch}
          onConfigure={onConfigure}
          onRemove={onRemove}
          onSelect={() => onSelectIndex(index)}
          onShiftIndex={onShiftIndex}
        />
      ))}
    </div>
  );
};


