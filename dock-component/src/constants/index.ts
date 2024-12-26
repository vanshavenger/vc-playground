import {
  Github,
  Home,
  ShoppingBagIcon,
  TerminalIcon,
  X,
} from "lucide-react";
import { LinkInterface } from "./types";

export const links: LinkInterface[] = [
  {
    title: "Home",
    Icon: Home,
    href: "/",
  },
  {
    title: "Products",
    Icon: ShoppingBagIcon,
    href: "/about",
  },
  {
    title: "Components",
    Icon: TerminalIcon,
    href: "/components",
  },
  {
    title: "VC Portfolio",
    Icon: Github,
    href: "https://vansh.dsandev.in",
  },
  {
    title: "Twitter",
    Icon: X,
    href: "https://twitter.com/Vansh_Avenger",
  },
  {
    title: "GitHub",
    Icon: Github,
    href: "https://github.com/vanshavenger",
  },
  {
    title: "DSA & DEV",
    Icon: TerminalIcon,
    href: "https://www.dsandev.in",
  },
];
