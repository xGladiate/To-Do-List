self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destination = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => new URL(client.url).origin === self.location.origin)

      if (matchingClient) {
        return matchingClient.focus()
      }

      return self.clients.openWindow(destination)
    }),
  )
})
