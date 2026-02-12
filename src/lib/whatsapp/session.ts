import { createServerClient } from '@/lib/supabase'

export type SessionState =
    | 'IDLE'
    | 'WAITING_FOR_INCIDENT_TYPE'
    | 'WAITING_FOR_INCIDENT_DESCRIPTION'
    | 'WAITING_FOR_INCIDENT_PHOTO'
    | 'WAITING_FOR_INCIDENT_LOCATION'
    | 'WAITING_FOR_STOCK_MENU_CHOICE'
    | 'WAITING_FOR_STOCK_SEARCH_QUERY'
    | 'WAITING_FOR_SIGNALEMENT_PAYS'
    | 'WAITING_FOR_SIGNALEMENT_CHANTIER'
    | 'WAITING_FOR_SIGNALEMENT_PROBLEME'
    | 'WAITING_FOR_SIGNALEMENT_ACTION'
    | 'WAITING_FOR_SIGNALEMENT_SECTION'
    | 'WAITING_FOR_SIGNALEMENT_PERSONNE'
    | 'WAITING_FOR_SIGNALEMENT_ECHEANCE'
    | 'WAITING_FOR_SIGNALEMENT_ID_UPDATE'
    | 'WAITING_FOR_SIGNALEMENT_UPDATE_FIELD'
    | 'WAITING_FOR_SIGNALEMENT_RAPPORT'
    | 'WAITING_FOR_SIGNALEMENT_NEW_ECHEANCE'
    | 'WAITING_FOR_SIGNALEMENT_NEW_PERSONNE'
    | 'WAITING_FOR_PROJECT_ID_FINANCES'
    // Nouveaux workflows menu
    | 'WORKFLOW_INCIDENT_TYPE'
    | 'WORKFLOW_INCIDENT_PROJECT'
    | 'WORKFLOW_INCIDENT_DESCRIPTION'
    | 'WORKFLOW_INCIDENT_PHOTO'
    | 'WORKFLOW_MEDIA_PROJECT'
    | 'WORKFLOW_MEDIA_UPLOAD'

export interface SessionData {
    incidentType?: string
    incidentDescription?: string
    incidentPhotoId?: string
    history?: any[]
    [key: string]: any
}

export interface Session {
    phone_number: string
    state: SessionState
    data: SessionData
    updated_at: string
}

export async function getSession(phoneNumber: string): Promise<Session> {
    const supabase = createServerClient()

    const { data, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single()

    if (error || !data) {
        // Return default session if not found
        return {
            phone_number: phoneNumber,
            state: 'IDLE',
            data: {},
            updated_at: new Date().toISOString()
        }
    }

    return data as Session
}

export async function updateSession(phoneNumber: string, state: SessionState, data: SessionData = {}) {
    const supabase = createServerClient()

    // Merge existing data with new data
    const currentSession = await getSession(phoneNumber)
    const newData = { ...currentSession.data, ...data }

    const { error } = await supabase
        .from('whatsapp_sessions')
        .upsert({
            phone_number: phoneNumber,
            state,
            data: newData,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating session:', error)
    }
}

export async function clearSession(phoneNumber: string) {
    await updateSession(phoneNumber, 'IDLE', {})
}
