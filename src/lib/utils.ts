import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatage des montants en FCFA
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant)
}

// Formatage court des montants (millions/milliards)
export function formatMontantCourt(montant: number): string {
  if (montant >= 1_000_000_000) {
    return `${(montant / 1_000_000_000).toFixed(1)} Mds`
  }
  if (montant >= 1_000_000) {
    return `${(montant / 1_000_000).toFixed(1)} M`
  }
  if (montant >= 1_000) {
    return `${(montant / 1_000).toFixed(0)} K`
  }
  return montant.toString()
}

// Formatage des dates
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

// Formatage date relative
export function formatDateRelative(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `il y a ${Math.abs(diffDays)} jour(s)`
  }
  if (diffDays === 0) {
    return "aujourd'hui"
  }
  if (diffDays === 1) {
    return 'demain'
  }
  if (diffDays <= 7) {
    return `dans ${diffDays} jours`
  }
  if (diffDays <= 30) {
    return `dans ${Math.ceil(diffDays / 7)} semaine(s)`
  }
  return `dans ${Math.ceil(diffDays / 30)} mois`
}

// Calcul du pourcentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// Couleurs par statut
export function getStatusColor(statut: string): string {
  const colors: Record<string, string> = {
    'En cours': 'bg-blue-100 text-blue-800',
    'Achevé': 'bg-green-100 text-green-800',
    'Suspendu': 'bg-yellow-100 text-yellow-800',
    'Annulé': 'bg-red-100 text-red-800',
    'Soldé': 'bg-green-100 text-green-800',
    'En attente': 'bg-yellow-100 text-yellow-800',
    'Payé': 'bg-green-100 text-green-800',
    'En retard': 'bg-red-100 text-red-800',
    'Actif': 'bg-green-100 text-green-800',
    'Inactif': 'bg-gray-100 text-gray-800',
    'En service': 'bg-green-100 text-green-800',
    'En maintenance': 'bg-orange-100 text-orange-800',
    'Hors service': 'bg-red-100 text-red-800',
    'Ouvert': 'bg-red-100 text-red-800',
    'Résolu': 'bg-green-100 text-green-800',
    'Clôturé': 'bg-gray-100 text-gray-800',
  }
  return colors[statut] || 'bg-gray-100 text-gray-800'
}

// Couleurs par priorité d'alerte
export function getPriorityColor(priorite: string): string {
  const colors: Record<string, string> = {
    'haute': 'bg-red-500',
    'moyenne': 'bg-orange-500',
    'basse': 'bg-blue-500',
  }
  return colors[priorite] || 'bg-gray-500'
}

// Couleurs par gravité d'incident
export function getGraviteColor(gravite: string): string {
  const colors: Record<string, string> = {
    'Mineure': 'bg-blue-100 text-blue-800',
    'Moyenne': 'bg-yellow-100 text-yellow-800',
    'Grave': 'bg-orange-100 text-orange-800',
    'Très grave': 'bg-red-100 text-red-800',
  }
  return colors[gravite] || 'bg-gray-100 text-gray-800'
}

// Couleurs par niveau de performance
export function getPerformanceColor(niveau: string): string {
  const colors: Record<string, string> = {
    'Très bon': 'text-green-600',
    'Bon': 'text-blue-600',
    'Moyen': 'text-yellow-600',
    'Faible': 'text-red-600',
  }
  return colors[niveau] || 'text-gray-600'
}

// Génération d'ID unique
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}
