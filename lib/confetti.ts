import confetti from 'canvas-confetti'

export function fireCelebration() {
    const duration = 2500
    const end = Date.now() + duration

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

    // First burst
    confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors,
    })

    // Side cannons
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors,
        })
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors,
        })
    }, 250)

    // Continuous rain
    const interval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(interval)
            return
        }

        confetti({
            particleCount: 15,
            spread: 120,
            origin: { x: Math.random(), y: Math.random() * 0.3 },
            colors,
            ticks: 150,
            gravity: 1.2,
        })
    }, 200)
}
