"use client"

import { createContext, useContext, useState, useEffect } from "react"
import useSWR from "swr"

const AuthContext = createContext(null)

const fetcher = (url) => fetch(url).then((res) => res.json())

export function AuthProvider({ children }) {
  const { data, error, mutate } = useSWR("/api/auth/me", fetcher)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (data !== undefined || error) {
      setIsLoading(false)
    }
  }, [data, error])

  const user = data?.user || null
  const isAuthenticated = !!user

  const login = async (credentials) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    const data = await res.json()
    if (data.success) {
      await mutate()
    }
    return data
  }

  const signup = async (userData) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })
    const data = await res.json()
    if (data.success) {
      await mutate()
    }
    return data
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await mutate(null, false)
  }

  const updateProfile = async (profileData) => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    })
    const data = await res.json()
    if (data.success) {
      await mutate()
    }
    return data
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refresh: mutate,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
