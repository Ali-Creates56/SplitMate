import { useEffect, useRef } from "react";

const backHandlers = [];
let initialized = false;

/**
 * A hook to register a hardware back button handler for Android/Capacitor.
 * The most recently registered active handler will be executed when the back button is pressed.
 * 
 * @param {boolean} isActive - Whether the back handler should be active.
 * @param {Function} handler - The function to call when the back button is pressed.
 */
export function useHardwareBack(isActive, handler) {
  const handlerRef = useRef(handler);

  // Keep the latest handler reference without triggering re-registration
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!isActive) return;

    // Push a stable wrapper to the stack
    const stackItem = () => {
      if (handlerRef.current) {
        handlerRef.current();
      }
    };

    backHandlers.push(stackItem);

    // Initialize the global listener only once
    if (!initialized) {
      initialized = true;
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        import("@capacitor/app").then(({ App }) => {
          App.addListener("backButton", ({ canGoBack }) => {
            if (backHandlers.length > 0) {
              // Execute and pop the topmost handler
              const lastHandler = backHandlers[backHandlers.length - 1];
              lastHandler();
            } else {
              // If no custom handlers are registered, exit the app
              App.exitApp();
            }
          });
        });
      }
    }

    // Cleanup: remove the handler from the stack on unmount or when isActive becomes false
    return () => {
      const index = backHandlers.indexOf(stackItem);
      if (index > -1) {
        backHandlers.splice(index, 1);
      }
    };
  }, [isActive]);
}
