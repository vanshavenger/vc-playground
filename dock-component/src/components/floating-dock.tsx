"use client";

import { links } from "@/constants";
import { LinkInterface } from "@/constants/types";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

export const FloatingDock = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <FloatingDockCore />
    </div>
  );
};

const FloatingDockCore = () => {
  const mouseX = useMotionValue(Infinity);
  return (
    <nav
      aria-label="Floating dock navigation"
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-10 inset-x-0 mx-auto h-16 flex items-center justify-center w-fit gap-4 bg-neutral-800 px-4 rounded-full"
    >
      {links.map((link, index) => (
        <IconContainer key={index} link={link} mouseX={mouseX} />
      ))}
    </nav>
  );
};

export const IconContainer = ({
  link,
  mouseX,
}: {
  link: LinkInterface;
  mouseX: MotionValue<number>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (x) => {
    const bounds = ref?.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return x - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

  const widthIconTransform = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightIconTransform = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20],
  );
  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthIconTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const heightIcon = useSpring(heightIconTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={link.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="focus:outline-none rounded-full"
      aria-label={link.title}
    >
      <motion.div
        style={{ width, height }}
        ref={ref}
        className="flex relative items-center bg-neutral-700 justify-center rounded-full"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
                x: "-50%",
              }}
              animate={{
                opacity: 1,
                y: 0,
                x: "-50%",
              }}
              exit={{
                opacity: 0,
                y: 2,
                x: "-50%",
              }}
              transition={{
                duration: 0.2,
              }}
              className="absolute text-xs inset-x-0 left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 whitespace-pre w-fit bg-neutral-800 text-neutral-200 rounded-full"
              aria-hidden="true"
            >
              {link.title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          <link.Icon className="h-full w-full text-neutral-200" aria-hidden="true" />
        </motion.div>
      </motion.div>
    </Link>
  );
};

