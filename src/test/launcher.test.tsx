/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppTile } from '../components/AppTile';
import { AppGrid } from '../components/AppGrid';
import { AppTileState } from '../types/launcher';

describe('AppDock Frontend Tests', () => {
  const mockApps: AppTileState[] = [
    {
      id: 'atlas',
      name: 'Atlas File Manager',
      executablePath: 'C:\\Tools\\Atlas\\atlas.exe',
      arguments: [],
      workingDirectory: null,
      iconPath: null,
      enabled: true,
      status: 'ready',
      statusMessage: null,
    },
    {
      id: 'paperforge',
      name: 'PaperForge',
      executablePath: null,
      arguments: [],
      workingDirectory: null,
      iconPath: null,
      enabled: true,
      status: 'notConfigured',
      statusMessage: 'Path is not configured.',
    },
    {
      id: 'transformlab',
      name: 'TransformLab',
      executablePath: 'C:\\NonExistent\\transform.exe',
      arguments: [],
      workingDirectory: null,
      iconPath: null,
      enabled: true,
      status: 'missingExecutable',
      statusMessage: 'File not found',
    },
    {
      id: 'fourth-app',
      name: 'Custom Application',
      executablePath: 'C:\\Tools\\custom.exe',
      arguments: [],
      workingDirectory: null,
      iconPath: null,
      enabled: false,
      status: 'disabled',
      statusMessage: 'Disabled',
    },
  ];

  it('renders all four application tiles in grid', () => {
    const onLaunch = vi.fn();
    const onConfigure = vi.fn();
    const onRemove = vi.fn();
    const onSelectIndex = vi.fn();

    render(
      <AppGrid
        apps={mockApps}
        selectedIndex={0}
        launchingId={null}
        onLaunch={onLaunch}
        onConfigure={onConfigure}
        onRemove={onRemove}
        onSelectIndex={onSelectIndex}
        onReorderApps={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    expect(screen.getByText('Atlas File Manager')).toBeInTheDocument();
    expect(screen.getByText('PaperForge')).toBeInTheDocument();
    expect(screen.getByText('TransformLab')).toBeInTheDocument();
    expect(screen.getByText('Custom Application')).toBeInTheDocument();
  });

  it('displays accurate status indicators for each state', () => {
    render(
      <AppGrid
        apps={mockApps}
        selectedIndex={0}
        launchingId={null}
        onLaunch={vi.fn()}
        onConfigure={vi.fn()}
        onRemove={vi.fn()}
        onSelectIndex={vi.fn()}
        onReorderApps={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getByText('Missing path')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('triggers onLaunch when clicking an application tile with valid path', () => {
    const onLaunch = vi.fn();
    const onConfigure = vi.fn();
    const onRemove = vi.fn();

    render(
      <AppTile
        app={mockApps[0]}
        index={0}
        totalApps={mockApps.length}
        isSelected={false}
        isLaunching={false}
        isDraggingThis={false}
        isDragOverThis={false}
        wasJustDragged={false}
        onLaunch={onLaunch}
        onConfigure={onConfigure}
        onRemove={onRemove}
        onSelect={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Atlas File Manager'));
    expect(onLaunch).toHaveBeenCalledWith('atlas');
    expect(onConfigure).not.toHaveBeenCalled();
  });

  it('triggers onConfigure when clicking an unconfigured path tile', () => {
    const onLaunch = vi.fn();
    const onConfigure = vi.fn();
    const onRemove = vi.fn();

    render(
      <AppTile
        app={mockApps[1]}
        index={1}
        totalApps={mockApps.length}
        isSelected={false}
        isLaunching={false}
        isDraggingThis={false}
        isDragOverThis={false}
        wasJustDragged={false}
        onLaunch={onLaunch}
        onConfigure={onConfigure}
        onRemove={onRemove}
        onSelect={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('PaperForge'));
    expect(onConfigure).toHaveBeenCalledWith(mockApps[1]);
    expect(onLaunch).not.toHaveBeenCalled();
  });

  it('triggers onRemove when clicking remove button', () => {
    const onLaunch = vi.fn();
    const onConfigure = vi.fn();
    const onRemove = vi.fn();

    render(
      <AppTile
        app={mockApps[0]}
        index={0}
        totalApps={mockApps.length}
        isSelected={false}
        isLaunching={false}
        isDraggingThis={false}
        isDragOverThis={false}
        wasJustDragged={false}
        onLaunch={onLaunch}
        onConfigure={onConfigure}
        onRemove={onRemove}
        onSelect={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    const removeBtn = screen.getByTitle('Remove application from AppDock');
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledWith('atlas');
  });

  it('supports keyboard Enter to activate tile', () => {
    const onLaunch = vi.fn();

    render(
      <AppTile
        app={mockApps[0]}
        index={0}
        totalApps={mockApps.length}
        isSelected={true}
        isLaunching={false}
        isDraggingThis={false}
        isDragOverThis={false}
        wasJustDragged={false}
        onLaunch={onLaunch}
        onConfigure={vi.fn()}
        onRemove={vi.fn()}
        onSelect={vi.fn()}
        onShiftIndex={vi.fn()}
      />
    );

    const tile = screen.getByTestId('app-tile-atlas');
    fireEvent.keyDown(tile, { key: 'Enter', code: 'Enter' });
    expect(onLaunch).toHaveBeenCalledWith('atlas');
  });
});
