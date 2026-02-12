/**
 * Magic Link Generator
 * Generates secure temporary links for WhatsApp data visualization
 */

import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'

export interface MagicLinkOptions {
    resourceType: 'signalements_table' | 'signalement_detail' | 'top20' | 'custom' | 'stocks' | 'finances' | 'projets' | 'imports' | 'missions' | 'dashboard'
    resourceId?: string
    filters?: Record<string, any>
    phoneNumber?: string
    expiryHours?: number
    metadata?: Record<string, any>
}

export interface MagicLinkResult {
    success: boolean
    url?: string
    token?: string
    expiresAt?: Date
    error?: string
}

/**
 * Generate a secure magic link
 */
export async function generateMagicLink(
    options: MagicLinkOptions
): Promise<MagicLinkResult> {
    try {
        const supabase = createServerClient()

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex')

        // Calculate expiry (default 24 hours)
        const expiryHours = options.expiryHours || 24
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expiryHours)

        // Insert into database
        const { data, error } = await supabase
            .from('magic_links')
            .insert({
                token,
                resource_type: options.resourceType,
                resource_id: options.resourceId || null,
                filters: options.filters || {},
                created_for_phone: options.phoneNumber || null,
                expires_at: expiresAt.toISOString(),
                metadata: options.metadata || {}
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Error creating magic link:', error)
            return {
                success: false,
                error: 'Failed to create magic link'
            }
        }

        // Construct full URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://asibi.netlify.app'
        const url = `${baseUrl}/ml/${token}`

        console.log('✅ Magic link created:', { token: token.substring(0, 10) + '...', expiresAt })

        return {
            success: true,
            url,
            token,
            expiresAt
        }
    } catch (error) {
        console.error('❌ Exception generating magic link:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Validate and consume a magic link token
 */
export async function validateMagicLink(token: string) {
    try {
        const supabase = createServerClient()

        // Call the validation function
        const { data, error } = await supabase
            .rpc('validate_magic_link', { p_token: token })

        if (error) {
            console.error('❌ Error validating magic link:', error)
            return {
                isValid: false,
                error: 'Validation failed'
            }
        }

        // Extract result (RPC returns array)
        const result = data?.[0]

        if (!result || !result.is_valid) {
            return {
                isValid: false,
                error: result?.error_message || 'Invalid link'
            }
        }

        return {
            isValid: true,
            linkId: result.link_id,
            resourceType: result.resource_type,
            resourceId: result.resource_id,
            filters: result.filters,
            metadata: result.metadata
        }
    } catch (error) {
        console.error('❌ Exception validating magic link:', error)
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Get magic link data without consuming it (for preview)
 */
export async function getMagicLinkData(token: string) {
    try {
        const supabase = createServerClient()

        const { data, error } = await supabase
            .from('magic_links')
            .select('*')
            .eq('token', token)
            .single()

        if (error || !data) {
            return {
                exists: false,
                error: 'Link not found'
            }
        }

        // Check expiry
        const expiresAt = new Date(data.expires_at)
        const isExpired = expiresAt < new Date()

        // Check if used
        const isUsed = data.used_at !== null

        return {
            exists: true,
            isExpired,
            isUsed,
            resourceType: data.resource_type,
            resourceId: data.resource_id,
            filters: data.filters,
            metadata: data.metadata,
            expiresAt,
            usedAt: data.used_at ? new Date(data.used_at) : null
        }
    } catch (error) {
        console.error('❌ Exception getting magic link data:', error)
        return {
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Cleanup expired magic links (call via cron)
 */
export async function cleanupExpiredMagicLinks() {
    try {
        const supabase = createServerClient()

        const { data, error } = await supabase
            .rpc('cleanup_expired_magic_links')

        if (error) {
            console.error('❌ Error cleaning up magic links:', error)
            return { success: false, deletedCount: 0 }
        }

        console.log(`✅ Cleaned up ${data} expired magic links`)
        return { success: true, deletedCount: data }
    } catch (error) {
        console.error('❌ Exception cleaning up magic links:', error)
        return { success: false, deletedCount: 0 }
    }
}
