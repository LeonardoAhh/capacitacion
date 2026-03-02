'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';

export function BancoPreguntasLegacy() {
    const [searchQuery, setSearchQuery] = useState('');
    const [preguntas, setPreguntas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/evaluaciones.json')
            .then((res) => res.json())
            .then((data) => setPreguntas(Array.isArray(data) ? data : []))
            .catch(() => setPreguntas([]))
            .finally(() => setLoading(false));
    }, []);

    const filteredPreguntas = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return [];
        return preguntas.filter(
            (p) =>
                p['PREGUNTA ']?.toLowerCase().includes(q) ||
                p.ID === q ||
                p.TEMA?.toLowerCase().includes(q)
        );
    }, [searchQuery, preguntas]);

    const getRespuesta = (p) => {
        const r = p.RESPUESTA?.trim();
        if (!r) return { letra: '', texto: 'N/A' };

        if (['A', 'B', 'C'].includes(r)) {
            const texto =
                p[`OPCIÓN ${r} `] ??
                p[`OPCIÓN ${r}`] ??
                r;
            return { letra: r, texto: String(texto) };
        }
        return { letra: '', texto: r };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-semibold md:text-3xl">
                    Banco de Preguntas
                </CardTitle>
                <CardDescription>
                    Escribe parte de la pregunta, ID o tema para encontrar la respuesta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Input
                    placeholder="Buscar pregunta, ID o tema..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md mb-4"
                    autoFocus
                />

                {loading && <p className="text-muted-foreground text-center py-8">Cargando...</p>}

                {!loading && !searchQuery.trim() && (
                    <p className="text-muted-foreground text-center py-8">
                        Escribe algo para buscar entre {preguntas.length} preguntas.
                    </p>
                )}

                {!loading && searchQuery.trim() && filteredPreguntas.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                        Sin resultados.
                    </p>
                )}

                <div className="space-y-3">
                    {filteredPreguntas.map((p) => {
                        const { letra, texto } = getRespuesta(p);
                        return (
                            <div key={p.ID} className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-muted-foreground">#{p.ID}</span>
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{p.TEMA}</span>
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{p.TIPO}</span>
                                </div>
                                <p className="font-medium mb-2">{p['PREGUNTA ']}</p>
                                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-2">
                                    <span className="text-green-700 dark:text-green-300 font-semibold">
                                        {letra ? `✓ ${letra}) ` : '✓ '}
                                    </span>
                                    <span className="text-green-800 dark:text-green-200">{texto}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}