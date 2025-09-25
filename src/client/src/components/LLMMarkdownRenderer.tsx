import React from 'react';
import { useLLMOutput } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import MarkdownComponent from './MarkdownRenderer';

interface LLMMarkdownRendererProps {
  content: string;
  isStreamFinished?: boolean;
}

const LLMMarkdownRenderer: React.FC<LLMMarkdownRendererProps> = ({ 
  content, 
  isStreamFinished = true 
}) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      // We can add more block types here in the future (code, etc.)
    ],
    isStreamFinished,
  });

  return (
    <div className="llm-markdown-output">
      {blockMatches.map((blockMatch: any, index: number) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
};

export default LLMMarkdownRenderer;
