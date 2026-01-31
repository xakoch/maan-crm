import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

interface RecentSalesProps {
    data: {
        id: string;
        name: string;
        email: string | null;
        total_value: number;
        status: string;
    }[];
}

export function RecentSales({ data }: RecentSalesProps) {
    if (!data || data.length === 0) {
        return <div className="text-sm text-muted-foreground">Нет последних заявок</div>
    }

    return (
        <div className="space-y-8">
            {data.map((lead) => (
                <div key={lead.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`/avatars/${(lead.name.length % 5) + 1}.png`} alt="Avatar" />
                        <AvatarFallback>{lead.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{lead.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {lead.email || lead.status}
                        </p>
                    </div>
                    <div className="ml-auto font-medium">
                        {lead.total_value > 0 ? `+${lead.total_value.toLocaleString()} сум` : '-'}
                    </div>
                </div>
            ))}
        </div>
    )
}
