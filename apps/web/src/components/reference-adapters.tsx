"use client";

import NextLink from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  createContext,
  useContext,
  type ReactElement,
  type ComponentProps,
  type ReactNode,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { twMerge } from "tailwind-merge";

export const cx = (...values: (string | undefined)[]) =>
  twMerge(values.filter(Boolean).join(" "));
export const Tabs = TabsPrimitive.Root;
export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      {...props}
      className={cx(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
    />
  );
}
export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      {...props}
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className,
      )}
    />
  );
}
export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      {...props}
      className={cx(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    />
  );
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & {
  href?: string;
  to?: string;
  asChild?: boolean;
};
export function Link({ href, to, asChild, children, ...props }: LinkProps) {
  const destination = href ?? to ?? "/";
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      className?: string;
      children?: ReactNode;
    }>;
    return (
      <NextLink
        href={destination}
        {...props}
        className={props.className ?? child.props.className}
      >
        {child.props.children}
      </NextLink>
    );
  }
  return (
    <NextLink href={destination} {...props}>
      {children}
    </NextLink>
  );
}
export function useLocation(): [string, (path: string) => void] {
  const pathname = usePathname();
  const router = useRouter();
  return [pathname, (path) => router.push(path)];
}
const ReferencePath = createContext<string | null>(null);
export function ReferenceRouteProvider({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <ReferencePath.Provider value={path}>{children}</ReferencePath.Provider>
  );
}
export function useReferenceRoute() {
  const pathname = usePathname();
  const override = useContext(ReferencePath);
  const params = useParams();
  return { ...params, slug: (override ?? pathname).split("/").at(-1) };
}
type ButtonProps = ComponentProps<"button"> & {
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
};
export function Button({
  variant = "default",
  size = "default",
  className = "",
  asChild,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    default: "bg-primary text-primary-foreground border border-primary-border",
    outline:
      "border [border-color:var(--button-outline)] shadow-xs active:shadow-none",
    secondary: "border bg-secondary text-secondary-foreground",
    ghost: "border border-transparent",
    link: "text-primary underline-offset-4 hover:underline",
    destructive: "bg-destructive text-destructive-foreground",
  };
  const sizes = {
    default: "min-h-9 px-4 py-2",
    sm: "min-h-8 rounded-md px-3 text-xs",
    lg: "min-h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };
  const classes = cx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2",
    variants[variant],
    sizes[size],
    className,
  );
  if (asChild && isValidElement<{ className?: string }>(children))
    return cloneElement(children, { className: classes });
  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}
