import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
    ChevronDownIcon,
    ChevronLeftIcon,
    SunMoonIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentTheme } from "@/hooks/use-current-theme";

interface Props {
    projectId: string;
}

export const ProjectHeader = ({ projectId }: Props) => {
    const trpc = useTRPC();
    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );

    const { setTheme, theme } = useTheme();

    return (
        <header className="p-2 flex justify-between items-center border-b">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!"
                    >
                        <Image src="/logo_dark_mode.svg" alt="Coding Cat" width={18} height={18}/>
                        <span className="text-sm font-medium">{project.name}</span>
                        <ChevronDownIcon />

                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                    <DropdownMenuItem asChild>
                        <Link href="/">
                            <ChevronLeftIcon />
                            <span>
                                Go to Dashboard
                            </span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                            <SunMoonIcon className="size-4 text-muted-foreground"/> {/*Can set the appearance icon myself*/}
                            <span>Appearance</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                    <DropdownMenuRadioItem value="system">
                                        <span>System</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="light">
                                        <span>Light</span>
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="dark">
                                        <span>Dark</span>
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
};