import React from 'react';
import StoryNavigator, { StoryNavigatorProps } from './StoryNavigator';

export interface TableOfContentsModalProps extends Partial<StoryNavigatorProps> {
  onClose: () => void;
  onSelectTopic: (scenId: string, startPtr: number, presets?: Record<string, any>) => void;
  currentScenario: string | null;
  pointer?: number;
  language: 'JP' | 'EN';
  isSidebar?: boolean;
}

export default function TableOfContentsModal(props: TableOfContentsModalProps) {
  return (
    <StoryNavigator 
      {...props} 
      initialTab="toc"
      pointer={props.pointer || 0}
      maxPointer={props.maxPointer || 1000}
      currentDialogueText={props.currentDialogueText || ''}
      speaker={props.speaker || ''}
      onSeekPointer={props.onSeekPointer || (() => {})}
    />
  );
}
