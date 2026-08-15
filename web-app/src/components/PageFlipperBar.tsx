import React from 'react';
import StoryNavigator, { StoryNavigatorProps } from './StoryNavigator';

export interface PageFlipperBarProps extends Partial<StoryNavigatorProps> {
  pointer: number;
  maxPointer: number;
  currentScenario: string | null;
  scenarioData?: any;
  currentDialogueText: string;
  speaker: string;
  onSeekPointer: (pointer: number) => void;
  onOpenToc?: () => void;
  onClose: () => void;
  language: 'JP' | 'EN';
}

export default function PageFlipperBar(props: PageFlipperBarProps) {
  return (
    <StoryNavigator 
      {...props} 
      initialTab="flipper" 
      onSelectTopic={props.onSelectTopic || (() => {})}
    />
  );
}
