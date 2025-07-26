import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface SafeHtmlProps {
  /** The HTML content to render safely */
  content: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** HTML tag to use as container (default: 'div') */
  as?: keyof JSX.IntrinsicElements;
  /** Maximum number of lines to display (adds line-clamp) */
  maxLines?: number;
}

/**
 * SafeHtml component renders HTML content safely by sanitizing it with DOMPurify.
 * It prevents XSS attacks while allowing safe HTML formatting.
 * 
 * @example
 * <SafeHtml 
 *   content="<p>This is <strong>bold</strong> text</p>" 
 *   className="text-sm"
 *   maxLines={3}
 * />
 */
export function SafeHtml({ 
  content, 
  className, 
  as: Component = 'div', 
  maxLines 
}: SafeHtmlProps): JSX.Element {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Configure DOMPurify to allow common formatting tags
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 
        'a', 'img',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'td', 'th'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style',
        'target', 'rel', 'width', 'height'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
    
    return cleanContent;
  }, [content]);

  if (!content || !sanitizedContent) {
    return <Component className={className} />;
  }

  const computedClassName = cn(
    // Base styles for HTML content
    'prose prose-sm max-w-none',
    // Line clamping if specified
    maxLines && `line-clamp-${maxLines}`,
    // Custom styles
    className
  );

  return (
    <Component
      className={computedClassName}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

export default SafeHtml;
