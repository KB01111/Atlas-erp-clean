import { cn } from "@/lib/utils";
import React from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

const h1 = ({ children, className }: TypographyProps) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
    >
      {children}
    </h1>
  );
};

const h2 = ({ children, className }: TypographyProps) => {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
    >
      {children}
    </h2>
  );
};

const h3 = ({ children, className }: TypographyProps) => {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
};

const h4 = ({ children, className }: TypographyProps) => {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
    >
      {children}
    </h4>
  );
};

const p = ({ children, className }: TypographyProps) => {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
    >
      {children}
    </p>
  );
};

const blockquote = ({ children, className }: TypographyProps) => {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
      {children}
    </blockquote>
  );
};

const table = ({ children, className }: TypographyProps) => {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn("w-full", className)}>{children}</table>
    </div>
  );
};

const tr = ({ children, className }: TypographyProps) => {
  return <tr className={cn("m-0 border-t p-0 even:bg-muted", className)}>{children}</tr>;
};

const th = ({ children, className }: TypographyProps) => {
  return (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
    >
      {children}
    </th>
  );
};

const td = ({ children, className }: TypographyProps) => {
  return (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className
      )}
    >
      {children}
    </td>
  );
};

const ul = ({ children, className }: TypographyProps) => {
  return <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>{children}</ul>;
};

const ol = ({ children, className }: TypographyProps) => {
  return <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}>{children}</ol>;
};

const li = ({ children, className }: TypographyProps) => {
  return <li className={cn("", className)}>{children}</li>;
};

const lead = ({ children, className }: TypographyProps) => {
  return <p className={cn("text-xl text-muted-foreground", className)}>{children}</p>;
};

const large = ({ children, className }: TypographyProps) => {
  return <div className={cn("text-lg font-semibold", className)}>{children}</div>;
};

const small = ({ children, className }: TypographyProps) => {
  return <small className={cn("text-sm font-medium leading-none", className)}>{children}</small>;
};

const muted = ({ children, className }: TypographyProps) => {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
};

const code = ({ children, className }: TypographyProps) => {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
    >
      {children}
    </code>
  );
};

export const Typography = {
  h1,
  h2,
  h3,
  h4,
  p,
  blockquote,
  table,
  tr,
  th,
  td,
  ul,
  ol,
  li,
  lead,
  large,
  small,
  muted,
  code,
};
