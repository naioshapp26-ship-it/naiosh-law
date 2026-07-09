import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  PropsWithChildren,
} from "react";

type StaticMotionProps = {
  variants?: unknown;
  initial?: unknown;
  animate?: unknown;
  transition?: unknown;
};

function stripMotionProps<T extends StaticMotionProps>(props: T) {
  const { variants, initial, animate, transition, ...rest } = props;
  void variants;
  void initial;
  void animate;
  void transition;

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
  div: StaticDiv,
  h1: StaticHeading,
  p: StaticParagraph,
  button: StaticButton,
};
