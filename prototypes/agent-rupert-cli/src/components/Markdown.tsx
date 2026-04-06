import React from 'react';
import { Text } from 'ink';
import { marked, type MarkedExtension } from 'marked';
// @ts-expect-error -- marked-terminal has no type declarations
import { markedTerminal } from 'marked-terminal';

marked.use(markedTerminal() as MarkedExtension);

export function Markdown({ children }: { children: string }) {
  const rendered = marked.parse(children) as string;
  return <Text>{rendered.trimEnd()}</Text>;
}
