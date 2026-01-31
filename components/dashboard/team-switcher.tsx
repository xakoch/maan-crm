"use client";

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const teams = [
    {
        label: "Все филиалы",
        value: "all",
    },
    {
        label: "Ташкент (Главный)",
        value: "tashkent",
    },
    {
        label: "Самарканд",
        value: "samarkand",
    },
]

type Team = (typeof teams)[number]

export function TeamSwitcher({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const [open, setOpen] = React.useState(false)
    const [selectedTeam, setSelectedTeam] = React.useState<Team>(teams[0])

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a team"
                        className="w-[200px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                M
                            </div>
                            {selectedTeam.label}
                        </div>

                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Поиск филиала..." />
                            <CommandEmpty>Филиал не найден.</CommandEmpty>
                            <CommandGroup heading="Филиалы">
                                {teams.map((team) => (
                                    <CommandItem
                                        key={team.value}
                                        onSelect={() => {
                                            setSelectedTeam(team)
                                            setOpen(false)
                                        }}
                                        className="text-sm"
                                    >
                                        {team.label}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedTeam.value === team.value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
