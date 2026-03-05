"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { City, Region } from "@/types/app"
import {
    createCity, updateCity, deleteCity,
    createRegion, updateRegion,
} from "@/app/actions/settings"

interface CityManagementProps {
    initialRegions: Region[]
    initialCities: City[]
}

export function CityManagement({ initialRegions, initialCities }: CityManagementProps) {
    const [regions, setRegions] = useState<Region[]>(initialRegions)
    const [cities, setCities] = useState<City[]>(initialCities)
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set())

    // Region dialog
    const [regionDialogOpen, setRegionDialogOpen] = useState(false)
    const [editingRegion, setEditingRegion] = useState<Region | null>(null)
    const [regionState, setRegionState] = useState({
        slug: "",
        name_ru: "",
        name_uz: "",
        is_active: true,
        has_districts: false,
    })

    // City dialog
    const [cityDialogOpen, setCityDialogOpen] = useState(false)
    const [editingCity, setEditingCity] = useState<City | null>(null)
    const [cityRegion, setCityRegion] = useState("")
    const [cityState, setCityState] = useState({
        name_ru: "",
        name_uz: "",
        region: "",
        is_active: true,
    })

    // Delete
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deletingCity, setDeletingCity] = useState<string | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)

    function toggleRegionExpand(slug: string) {
        setExpandedRegions(prev => {
            const next = new Set(prev)
            if (next.has(slug)) next.delete(slug)
            else next.add(slug)
            return next
        })
    }

    // Region handlers
    function openCreateRegion() {
        setEditingRegion(null)
        setRegionState({ slug: "", name_ru: "", name_uz: "", is_active: true, has_districts: false })
        setRegionDialogOpen(true)
    }

    function openEditRegion(region: Region) {
        setEditingRegion(region)
        setRegionState({
            slug: region.slug,
            name_ru: region.name_ru,
            name_uz: region.name_uz,
            is_active: region.is_active,
            has_districts: region.has_districts,
        })
        setRegionDialogOpen(true)
    }

    async function handleRegionSubmit() {
        if (!regionState.slug || !regionState.name_ru || !regionState.name_uz) {
            toast.error("Заполните все поля")
            return
        }
        setIsSubmitting(true)
        try {
            let result
            if (editingRegion) {
                result = await updateRegion(editingRegion.id, regionState)
            } else {
                result = await createRegion(regionState)
            }
            if (!result.success) throw new Error(result.error)
            toast.success(editingRegion ? "Регион обновлен" : "Регион создан")
            setRegionDialogOpen(false)
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleRegionToggle(region: Region) {
        const result = await updateRegion(region.id, { is_active: !region.is_active })
        if (!result.success) {
            toast.error("Ошибка")
            return
        }
        setRegions(prev => prev.map(r => r.id === region.id ? { ...r, is_active: !r.is_active } : r))
        toast.success(region.is_active ? "Регион отключен" : "Регион включен")
    }

    // City handlers
    function openCreateCity(regionSlug: string) {
        setEditingCity(null)
        setCityRegion(regionSlug)
        setCityState({ name_ru: "", name_uz: "", region: regionSlug, is_active: true })
        setCityDialogOpen(true)
    }

    function openEditCity(city: City) {
        setEditingCity(city)
        setCityState({
            name_ru: city.name_ru,
            name_uz: city.name_uz,
            region: city.region,
            is_active: city.is_active,
        })
        setCityDialogOpen(true)
    }

    async function handleCitySubmit() {
        if (!cityState.name_ru || !cityState.name_uz) {
            toast.error("Заполните все поля")
            return
        }
        setIsSubmitting(true)
        try {
            let result
            if (editingCity) {
                result = await updateCity(editingCity.id, cityState)
            } else {
                result = await createCity(cityState)
            }
            if (!result.success) throw new Error(result.error)
            toast.success(editingCity ? "Район обновлен" : "Район добавлен")
            setCityDialogOpen(false)
            window.location.reload()
        } catch (error: any) {
            toast.error(error.message || "Ошибка")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleCityToggle(city: City) {
        const result = await updateCity(city.id, { is_active: !city.is_active })
        if (!result.success) {
            toast.error("Ошибка")
            return
        }
        setCities(prev => prev.map(c => c.id === city.id ? { ...c, is_active: !c.is_active } : c))
        toast.success(city.is_active ? "Район отключен" : "Район включен")
    }

    async function handleCityDelete() {
        if (!deletingCity) return
        setIsSubmitting(true)
        try {
            const result = await deleteCity(deletingCity)
            if (!result.success) throw new Error(result.error)
            toast.success("Район удален")
            setCities(prev => prev.filter(c => c.id !== deletingCity))
            setDeleteDialogOpen(false)
            setDeletingCity(null)
        } catch (error: any) {
            toast.error(error.message || "Ошибка")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Регионы и районы</h3>
                <Button onClick={openCreateRegion} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить регион
                </Button>
            </div>

            <div className="border rounded-lg">
                {regions.map((region) => {
                    const regionCities = cities.filter(c => c.region === region.slug)
                    const isExpanded = expandedRegions.has(region.slug)

                    return (
                        <div key={region.id} className="border-b last:border-b-0">
                            <div
                                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer"
                                onClick={() => toggleRegionExpand(region.slug)}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <div>
                                        <span className="font-medium">{region.name_ru}</span>
                                        <span className="text-muted-foreground ml-2 text-sm">{region.name_uz}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {regionCities.length} {regionCities.length === 1 ? 'район' : 'районов'}
                                    </Badge>
                                    {region.has_districts && (
                                        <Badge variant="secondary" className="text-xs">С районами</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <Switch
                                        checked={region.is_active}
                                        onCheckedChange={() => handleRegionToggle(region)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditRegion(region)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {isExpanded && region.has_districts && (
                                <div className="bg-muted/30 px-4 py-2 border-t">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Название (RU)</TableHead>
                                                <TableHead>Название (UZ)</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {regionCities.map(city => (
                                                <TableRow key={city.id}>
                                                    <TableCell>{city.name_ru}</TableCell>
                                                    <TableCell>{city.name_uz}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={city.is_active}
                                                            onCheckedChange={() => handleCityToggle(city)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditCity(city)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setDeletingCity(city.id)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {regionCities.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                        Нет районов
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 mb-2"
                                        onClick={() => openCreateCity(region.slug)}
                                    >
                                        <Plus className="mr-2 h-3 w-3" />
                                        Добавить район
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Region Dialog */}
            <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRegion ? "Редактировать регион" : "Добавить регион"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Slug (идентификатор)</Label>
                            <Input
                                value={regionState.slug}
                                onChange={e => setRegionState(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                                placeholder="tashkent_city"
                                disabled={!!editingRegion}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Название (RU)</Label>
                                <Input
                                    value={regionState.name_ru}
                                    onChange={e => setRegionState(prev => ({ ...prev, name_ru: e.target.value }))}
                                    placeholder="Ташкент"
                                />
                            </div>
                            <div>
                                <Label>Название (UZ)</Label>
                                <Input
                                    value={regionState.name_uz}
                                    onChange={e => setRegionState(prev => ({ ...prev, name_uz: e.target.value }))}
                                    placeholder="Toshkent"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={regionState.is_active}
                                    onCheckedChange={v => setRegionState(prev => ({ ...prev, is_active: v }))}
                                />
                                <Label>Активен</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={regionState.has_districts}
                                    onCheckedChange={v => setRegionState(prev => ({ ...prev, has_districts: v }))}
                                />
                                <Label>Есть районы</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRegionDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleRegionSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingRegion ? "Сохранить" : "Создать"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* City Dialog */}
            <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCity ? "Редактировать район" : "Добавить район"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Название (RU)</Label>
                                <Input
                                    value={cityState.name_ru}
                                    onChange={e => setCityState(prev => ({ ...prev, name_ru: e.target.value }))}
                                    placeholder="Алмазар"
                                />
                            </div>
                            <div>
                                <Label>Название (UZ)</Label>
                                <Input
                                    value={cityState.name_uz}
                                    onChange={e => setCityState(prev => ({ ...prev, name_uz: e.target.value }))}
                                    placeholder="Olmazor"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Регион</Label>
                            <Select
                                value={cityState.region}
                                onValueChange={v => setCityState(prev => ({ ...prev, region: v }))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Выберите регион" />
                                </SelectTrigger>
                                <SelectContent>
                                    {regions.map(r => (
                                        <SelectItem key={r.id} value={r.slug}>
                                            {r.name_ru}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={cityState.is_active}
                                onCheckedChange={v => setCityState(prev => ({ ...prev, is_active: v }))}
                            />
                            <Label>Активен</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCityDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleCitySubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingCity ? "Сохранить" : "Добавить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete City Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить район?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCityDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
