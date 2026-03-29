import * as React from "react";
import { cn } from "@/lib/utils";

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  defaultDomain?: string;
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, value, onChange, defaultDomain = "bab-ul-ilm.com", ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Parse the current value
    const atIndex = value.indexOf('@');
    const hasAt = atIndex !== -1;
    const username = hasAt ? value.substring(0, atIndex) : value;
    const userDomain = hasAt ? value.substring(atIndex + 1) : '';
    
    // Determine what to show
    const showDefaultDomain = !hasAt || (hasAt && userDomain === '');
    const displayDomain = showDefaultDomain ? defaultDomain : userDomain;
    
    // Get the complete email value (for form submission)
    const getCompleteEmail = React.useCallback(() => {
      if (!value) return '';
      if (hasAt) {
        // User typed @, use their domain if provided, otherwise append default
        return userDomain ? value : `${username}@${defaultDomain}`;
      }
      // No @ typed, append default domain
      return `${value}@${defaultDomain}`;
    }, [value, hasAt, username, userDomain, defaultDomain]);
    
    // Expose complete email via a custom property for form access
    React.useEffect(() => {
      if (inputRef.current) {
        (inputRef.current as any).completeEmail = getCompleteEmail();
      }
    }, [getCompleteEmail]);
    
    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };
    
    // IMPORTANT: keep native browser validation from blocking submit.
    // We validate the derived "complete" email in the parent form (zod),
    // while this input holds only the editable portion.
    
    return (
      <div className="relative">
        {/* Hidden actual input */}
        <input
          type="email"
          ref={(node) => {
            // Handle both refs
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={value}
          onChange={handleChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "text-transparent caret-foreground selection:bg-primary/20 selection:text-transparent",
            className
          )}
          {...props}
        />
        
        {/* Visual overlay */}
        <div 
          className="pointer-events-none absolute inset-0 flex items-center px-3 text-base md:text-sm overflow-hidden"
          aria-hidden="true"
        >
          {/* Real username (typed text) */}
          {username && (
            <span className="text-foreground transition-colors duration-150">
              {username}
            </span>
          )}
          
          {/* Ghost username - show "user" only when nothing is typed */}
          {!value && (
            <span className="text-muted-foreground/60 transition-opacity duration-150">
              user
            </span>
          )}
          
          {/* Real @ (when user typed it) */}
          {hasAt && (
            <span className="text-foreground transition-colors duration-150">
              @
            </span>
          )}
          
          {/* Ghost @ (when user hasn't typed it yet but has typed something) */}
          {!hasAt && value && (
            <span className="text-muted-foreground/50 transition-opacity duration-150">
              @
            </span>
          )}
          
          {/* Ghost @ when completely empty */}
          {!value && (
            <span className="text-muted-foreground/60 transition-opacity duration-150">
              @
            </span>
          )}
          
          {/* Domain rendering - character by character matching */}
          {hasAt && (() => {
            // Check how much of the typed domain matches the default domain
            const matchingChars = userDomain.split('').reduce((count, char, idx) => {
              return defaultDomain[idx]?.toLowerCase() === char.toLowerCase() ? count + 1 : count;
            }, 0);
            
            // If user is typing something that matches default domain prefix
            const isTypingDefaultDomain = userDomain.length > 0 && 
              defaultDomain.toLowerCase().startsWith(userDomain.toLowerCase());
            
            if (isTypingDefaultDomain) {
              // Show typed portion in real color, rest in ghost
              return (
                <>
                  <span className="text-foreground transition-colors duration-150">
                    {userDomain}
                  </span>
                  <span className="text-muted-foreground/50 transition-opacity duration-150">
                    {defaultDomain.substring(userDomain.length)}
                  </span>
                </>
              );
            } else if (userDomain) {
              // User typed a custom domain that doesn't match
              return (
                <span className="text-foreground transition-colors duration-150">
                  {userDomain}
                </span>
              );
            } else {
              // No domain typed yet, show full ghost domain
              return (
                <span className="text-muted-foreground/50 transition-opacity duration-150">
                  {defaultDomain}
                </span>
              );
            }
          })()}
          
          {/* Ghost domain when no @ typed */}
          {!hasAt && (
            <span className="text-muted-foreground/50 transition-opacity duration-150">
              {defaultDomain}
            </span>
          )}
        </div>
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

// Helper hook to get complete email value
export const useCompleteEmail = (value: string, defaultDomain = "bab-ul-ilm.com") => {
  return React.useMemo(() => {
    if (!value) return '';
    const atIndex = value.indexOf('@');
    if (atIndex === -1) {
      return `${value}@${defaultDomain}`;
    }
    const userDomain = value.substring(atIndex + 1);
    if (!userDomain) {
      const username = value.substring(0, atIndex);
      return `${username}@${defaultDomain}`;
    }
    return value;
  }, [value, defaultDomain]);
};

export { EmailInput };
