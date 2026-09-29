import React from 'react';
import { Flame, Heart, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SITE_CONFIG } from '../config/siteConfig';

export default function Footer() {
  const { lastUpdated } = useApp();

  return (
    <footer className="mt-20 border-t border-[#212838] bg-[#0A0C10] text-gray-400 text-xs">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Coluna 1: Sobre & Marca */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-serif font-black text-white text-base uppercase tracking-wider">
                {SITE_CONFIG.name}
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              {SITE_CONFIG.tagline}. Acompanhe partidas ao vivo, estatísticas de heróis, histórico de confrontos e chaveamento dos principais torneios mundiais.
            </p>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-[11px] pt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Sincronizado: {lastUpdated ? `${lastUpdated} (Brasília)` : 'Recentemente'}</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">Navegação</h4>
            <ul className="space-y-2">
              <li><a href="/ao-vivo" className="hover:text-amber-400 transition-colors">Partidas Ao Vivo</a></li>
              <li><a href="/campeonatos" className="hover:text-amber-400 transition-colors">Torneios & Majors</a></li>
              <li><a href="/partidas" className="hover:text-amber-400 transition-colors">Resultados & Replays</a></li>
              <li><a href="/herois" className="hover:text-amber-400 transition-colors">Meta do Patch</a></li>
              <li><a href="/jogadores" className="hover:text-amber-400 transition-colors">Comparador de Jogadores</a></li>
              <li><a href="/palpites" className="hover:text-amber-400 transition-colors">Bolão de Palpites</a></li>
            </ul>
          </div>

          {/* Coluna 3: Fontes de Dados Oficiais */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">Fontes de Dados</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.opendota.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>OpenDota API</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://developer.valvesoftware.com/wiki/Steam_Web_API"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Steam Web API & Valve GOTV</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://liquipedia.net/dota2/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Liquipedia Dota 2 Wiki</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Supabase Database & Auth</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Comunidade */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3">Comunidade</h4>
            <p className="text-xs text-gray-400 mb-3">
              Junte-se à maior comunidade brasileira de fãs de Dota 2 competitivo para discutir picks, assistir aos jogos e dar palpites.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={SITE_CONFIG.community.discord}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] hover:bg-[#5865F2] hover:text-white text-xs font-bold transition-all"
              >
                <span>Discord Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {SITE_CONFIG.community.whatsapp && (
                <a
                  href={SITE_CONFIG.community.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366] hover:text-white text-xs font-bold transition-all"
                >
                  <span>Grupo WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Linha Final de Copyright */}
        <div className="pt-8 border-t border-[#212838] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. Todos os direitos reservados. Dota 2 é marca registrada da Valve Corporation.
          </div>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com carinho para a comunidade brasileira</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
