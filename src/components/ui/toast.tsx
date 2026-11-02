import * as React from 'react';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';
import {
  XIcon,
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

const toast = ToastPrimitive.createToastManager();

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        'pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto flex w-auto max-w-sm flex-col gap-3 outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full',
        className
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        'group/toast pointer-events-auto relative w-full rounded-xl border bg-popover text-popover-foreground shadow-lg transition-opacity duration-150 ease-out outline-none select-none data-ending-style:opacity-0 data-limited:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        'flex h-full items-center gap-3 overflow-hidden p-4 transition-opacity duration-150 ease-out data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none',
        className
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn('text-sm font-medium', className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn('shrink-0', className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  closeLabel,
  render = <Button variant="ghost" size="touch" />,
  ...props
}: ToastPrimitive.Close.Props & { closeLabel: string }) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label={closeLabel}
      render={render}
      className={cn('shrink-0 text-muted-foreground hover:text-foreground', className)}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === 'success') {
    icon = <CircleCheckIcon className="text-success" aria-hidden="true" />;
  }

  if (type === 'info') {
    icon = <InfoIcon className="text-info" aria-hidden="true" />;
  }

  if (type === 'warning') {
    icon = <TriangleAlertIcon className="text-warning" aria-hidden="true" />;
  }

  if (type === 'error') {
    icon = <OctagonXIcon className="text-destructive" aria-hidden="true" />;
  }

  if (type === 'loading') {
    icon = <Loader2Icon className="animate-spin motion-reduce:animate-none" aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  );
}

function ToastList({ closeLabel }: { closeLabel: string }) {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose closeLabel={closeLabel} />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = toast,
  closeLabel,
  ...props
}: ToastPrimitive.Provider.Props & { closeLabel: string }) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList closeLabel={closeLabel} />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
