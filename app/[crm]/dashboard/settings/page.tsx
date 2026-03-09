import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormManagement } from "@/components/settings/form-management"
import { CityManagement } from "@/components/settings/city-management"
import { PipelineManagement } from "@/components/settings/pipeline-management"
import { getFormConfigs, getRegions, getCities, getPipelineStages } from "@/app/actions/settings"

export default async function SettingsPage() {
    const [forms, regions, cities, pipelineStages] = await Promise.all([
        getFormConfigs(),
        getRegions(),
        getCities(),
        getPipelineStages(),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Настройки</h2>
                <p className="text-muted-foreground">
                    Управление формами, городами и воронкой продаж
                </p>
            </div>

            <Tabs defaultValue="pipeline">
                <TabsList>
                    <TabsTrigger value="pipeline">Воронка</TabsTrigger>
                    <TabsTrigger value="forms">Формы</TabsTrigger>
                    <TabsTrigger value="cities">Города и регионы</TabsTrigger>
                </TabsList>
                <TabsContent value="pipeline" className="mt-6">
                    <PipelineManagement initialStages={pipelineStages} />
                </TabsContent>
                <TabsContent value="forms" className="mt-6">
                    <FormManagement initialForms={forms} />
                </TabsContent>
                <TabsContent value="cities" className="mt-6">
                    <CityManagement initialRegions={regions} initialCities={cities} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
