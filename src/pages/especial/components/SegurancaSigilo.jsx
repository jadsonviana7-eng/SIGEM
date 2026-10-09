import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  Badge,
  Input,
  Pagination
} from "../../../components/ui";

export default function SegurancaSigilo({
  logs = [],
  usuario,
  escolaId
}) {
  const [busca, setBusca] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const logsFiltrados = logs.filter(l =>
    (l.usuarioNome || "").toLowerCase().includes(busca.toLowerCase()) ||
    (l.usuarioEmail || "").toLowerCase().includes(busca.toLowerCase()) ||
    (l.detalhes || "").toLowerCase().includes(busca.toLowerCase()) ||
    (l.acao || "").toLowerCase().includes(busca.toLowerCase())
  );

  const totalPages = Math.ceil(logsFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const logsPaginados = logsFiltrados.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* CARD DE POLÍTICA DE SIGILO LGPD */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl shrink-0 border border-indigo-500/30">
            <i className="ti ti-shield-lock" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Controle Rigoroso de Sigilo & Proteção de Dados (LGPD)</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Art. 11 - Dados Sensíveis de Saúde
              </span>
            </div>
            <p className="text-xs text-indigo-200 leading-relaxed max-w-4xl">
              Em cumprimento à <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong> e às diretrizes do MEC/CNE, 
              todos os diagnósticos clínicos, relatórios neuropediátricos, CID-10/11 e laudos médicos constantes neste módulo são de caráter 
              <strong> estritamente confidencial</strong>. Toda e qualquer abertura, consulta ou exportação de prontuário é 
              auditada digitalmente com registro de data, hora, IP e usuário solicitante.
            </p>
          </div>
        </div>
      </div>

      {/* QUADRO DE INDICADORES DE AUDITORIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total de Acessos Auditados</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{logs.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center text-xl">
              <i className="ti ti-history" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Nível de Criptografia</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">AES-256 / SSL TLS 1.3</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center text-xl">
              <i className="ti ti-lock-check" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Seu Acesso Atual</p>
              <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate max-w-[180px]">
                {usuario?.nome || "Usuário Autenticado"}
              </p>
              <p className="text-[10px] text-gray-400">Perfil: {usuario?.perfil || "AEE"}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-xl">
              <i className="ti ti-user-shield" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE AUDITORIA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i className="ti ti-receipt-tax text-blue-600 dark:text-blue-400" />
              Trilha de Auditoria - Consultas a Laudos e Dados Sensíveis
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Registros imutáveis de acesso a diagnósticos e laudos médicos
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <Input
              placeholder="Buscar por usuário, ação ou termo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              icon="ti ti-search"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-left text-xs uppercase tracking-wider">
                  <th className="p-3.5">Data & Hora</th>
                  <th className="p-3.5">Usuário Responsável</th>
                  <th className="p-3.5">Ação Realizada</th>
                  <th className="p-3.5">Detalhes do Acesso</th>
                  <th className="p-3.5">Nível de Sigilo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {logsPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      Nenhum registro de acesso registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  logsPaginados.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="p-3.5 text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-nowrap">
                        {log.dataAcesso ? new Date(log.dataAcesso).toLocaleString("pt-BR") : "Agora"}
                      </td>
                      <td className="p-3.5 font-medium text-gray-900 dark:text-white">
                        <div>
                          <p className="font-semibold text-xs">{log.usuarioNome || "Usuário"}</p>
                          <p className="text-[11px] text-gray-400">{log.usuarioEmail || "-"}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="warning">{log.acao || "Visualização"}</Badge>
                      </td>
                      <td className="p-3.5 text-xs text-gray-700 dark:text-gray-300 max-w-md">
                        {log.detalhes}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          <i className="ti ti-shield-half" /> Confidencial
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
