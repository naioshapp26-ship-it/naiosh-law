import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren,
} from "react";

type StaticMotionProps = {
  animate?: unknown;
  initial?: unknown;
  transition?: unknown;
  variants?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
};

function stripMotionProps<T extends StaticMotionProps>(props: T) {
  const {
    animate,
    initial,
    transition,
    variants,
    viewport,
    whileHover,
    whileTap,
    ...rest
  } = props;

  void animate;
  void initial;
  void transition;
  void variants;
  void viewport;
  void whileHover;
  void whileTap;

  return rest;
}

function StaticDiv(props: PropsWithChildren<HTMLAttributes<HTMLDivElement> & StaticMotionProps>) {
  return <div {...stripMotionProps(props)} />;
}

function StaticHeading(props: PropsWithChildren<HTMLAttributes<HTMLHeadingElement> & StaticMotionProps>) {
  return <h1 {...stripMotionProps(props)} />;
}

function StaticParagraph(props: PropsWithChildren<HTMLAttributes<HTMLParagraphElement> & StaticMotionProps>) {
  return <p {...stripMotionProps(props)} />;
}

function StaticButton(props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & StaticMotionProps>) {
  return <button {...stripMotionProps(props)} />;
}

export const staticMotion = {
  button: StaticButton,
  div: StaticDiv,
  h1: StaticHeading,
  p: StaticParagraph,
};
