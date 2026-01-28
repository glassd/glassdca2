import { useState, useEffect } from "react";
import { Icon, type IconProps } from "@iconify/react";

export default function ClientIcon(props: IconProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={props.className} />;
  }

  return <Icon {...props} />;
}
