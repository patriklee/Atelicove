import { Icons } from "./index";

export default function Icon({
    name,
    size = 20,
    strokeWidth = 1.75,
    color = "currentColor",
    ...props
}) {
    const Component = Icons[name];

    if (!Component) {
        console.warn(`Unknown icon: ${name}`);
        return null;
    }

    return (
        <Component
            width={size}
            height={size}
            color={color}
            strokeWidth={strokeWidth}
            {...props}
        />
    );
}