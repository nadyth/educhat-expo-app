import React from 'react';
import { Text, TextStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface RichTextProps {
  text: string;
  style?: TextStyle;
}

/**
 * Lightweight inline rich-text renderer.
 * Handles **bold**, *italic*, and `code` — incomplete syntax renders as plain text.
 */
export function RichText({ text, style }: RichTextProps) {
  const spans = parseInline(text);
  return <Text style={style}>{spans.map((s, i) => renderSpan(s, i))}</Text>;
}

type Span =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string };

function parseInline(input: string): Span[] {
  const spans: Span[] = [];
  let i = 0;

  while (i < input.length) {
    // --- `code` ---
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end !== -1) {
        spans.push({ type: 'code', value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
      // No closing backtick — treat ` as plain text
    }

    // --- **bold** ---
    // Opening ** must not be followed by space or end of string
    if (input[i] === '*' && input[i + 1] === '*' && input[i + 2] !== ' ' && input[i + 2] !== undefined) {
      const end = input.indexOf('**', i + 2);
      if (end !== -1) {
        spans.push({ type: 'bold', value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
      // No closing ** — treat as plain text
    }

    // --- *italic* ---
    // Opening * must not be followed by * or space or end of string
    if (input[i] === '*' && input[i + 1] !== '*' && input[i + 1] !== ' ' && input[i + 1] !== undefined) {
      // Find closing * that isn't part of a ** pair
      let end = i + 1;
      while (end < input.length) {
        end = input.indexOf('*', end);
        if (end === -1) break;
        // Closing * must not be followed by another * (would be **)
        if (input[end + 1] !== '*') {
          spans.push({ type: 'italic', value: input.slice(i + 1, end) });
          i = end + 1;
          break;
        }
        end++; // skip past the ** and keep looking
      }
      if (end !== -1 && spans[spans.length - 1]?.type === 'italic') {
        continue;
      }
      // No closing * found — treat as plain text
    }

    // --- Plain text ---
    const start = i;
    while (i < input.length && input[i] !== '`' && input[i] !== '*') {
      i++;
    }
    if (i > start) {
      spans.push({ type: 'text', value: input.slice(start, i) });
    } else {
      // At a formatting char that didn't match any pattern — consume one char
      spans.push({ type: 'text', value: input[i] });
      i++;
    }
  }

  return spans;
}

function renderSpan(span: Span, index: number): React.ReactNode {
  switch (span.type) {
    case 'bold':
      return (
        <Text key={index} style={{ fontWeight: '700', color: theme.colors.text }}>
          {span.value}
        </Text>
      );
    case 'italic':
      return (
        <Text key={index} style={{ fontStyle: 'italic' }}>
          {span.value}
        </Text>
      );
    case 'code':
      return (
        <Text
          key={index}
          style={{
            fontFamily: 'monospace',
            fontSize: 14,
            backgroundColor: theme.colors.surfaceAlt,
            color: theme.colors.primary,
            paddingHorizontal: 3,
            paddingVertical: 1,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {span.value}
        </Text>
      );
    default:
      return <Text key={index}>{span.value}</Text>;
  }
}