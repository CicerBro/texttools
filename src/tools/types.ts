export type Tool = {
  id: string;
  index: string;
  name: string;
  blurb: string;
  mount: (root: HTMLElement) => void;
};
