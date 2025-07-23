"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getTranslations, useTranslation, type TranslationFunction } from '@/lib/i18n'
import { SettingsService } from '@/lib/settings'
import type { Locale } from '@/lib/i18n/config'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationFunction
  isLoading: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translations, setTranslations] = useState<Record<string, any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial locale from settings
  useEffect(() => {
    const settings = SettingsService.loadSettings()
    const savedLocale = settings.language as Locale
    setLocaleState(savedLocale || 'en')
  }, [])

  // Load translations when locale changes
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    const loadTranslations = async () => {
      try {
        const translationData = await getTranslations(locale)
        
        if (!isCancelled) {
          setTranslations(translationData)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading translations:', error)
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTranslations()

    return () => {
      isCancelled = true
    }
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    
    // Update settings when locale changes
    const settings = SettingsService.loadSettings()
    settings.language = newLocale
    SettingsService.saveSettings(settings)
  }

  const { t } = useTranslation(locale, translations)

  const contextValue: TranslationContextType = {
    locale,
    setLocale,
    t,
    isLoading
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useI18n(): TranslationContextType {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within a TranslationProvider')
  }
  return context
}
