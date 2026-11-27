import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AxiosError } from 'axios'
import { createServer } from 'vite'

async function withServer(run) {
  const server = await createServer({
    configFile: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://backend.test/'),
      'import.meta.env.VITE_SIGNALR_HUB_URL': JSON.stringify('http://backend.test/hubs/events'),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  })
  try {
    await run((path) => server.ssrLoadModule(path))
  } finally {
    await server.close()
  }
}

test('meeting links accept HTTPS hosts and reject unsafe or oversized values', async () => {
  await withServer(async (load) => {
    const { normalizeMeetingLink } = await load('/src/features/heatmap/meetingLink.ts')
    assert.deepEqual(normalizeMeetingLink('  '), { url: null, error: null })
    assert.deepEqual(normalizeMeetingLink(' https://meet.google.com/abc-defg-hij '), {
      url: 'https://meet.google.com/abc-defg-hij', error: null,
    })
    assert.deepEqual(normalizeMeetingLink('https://zoom.us/j/123'), {
      url: 'https://zoom.us/j/123', error: null,
    })
    for (const value of ['http://meet.google.com/abc', 'javascript:alert(1)', '/room', 'https://meet.google.com/a b']) {
      assert.equal(normalizeMeetingLink(value).error, 'invalid', value)
    }
    assert.equal(normalizeMeetingLink(`https://example.com/${'x'.repeat(481)}`).error, 'tooLong')
  })
})

test('meeting link API uses event auth, supports clearing, and finalize keeps its schedule body', async () => {
  await withServer(async (load) => {
    const { api } = await load('/src/lib/axios.ts')
    const { useParticipantStore } = await load('/src/features/participants/store.ts')
    const { updateMeetingUrl, finalizeEvent } = await load('/src/shared/api/events.ts')
    useParticipantStore.setState({
      auth: { shortCode: 'A/B', participantId: 'p1', username: 'Host', isAdmin: true, accessToken: 'host-token' },
    })
    const requests = []
    api.defaults.adapter = async (config) => {
      requests.push({ url: config.url, method: config.method, auth: config.headers.Authorization, body: JSON.parse(config.data) })
      const value = config.url.endsWith('/finalize')
        ? { status: 2, finalSchedule: JSON.parse(config.data), meetingUrl: null, revision: 8 }
        : { meetingUrl: JSON.parse(config.data).meetingUrl, revision: requests.length + 5 }
      return { data: { isSuccess: true, code: 200, message: 'OK', value }, status: 200, statusText: 'OK', headers: {}, config }
    }

    assert.deepEqual(await updateMeetingUrl('A/B', 'https://meet.google.com/abc'), {
      meetingUrl: 'https://meet.google.com/abc', revision: 6,
    })
    assert.deepEqual(await updateMeetingUrl('A/B', null), { meetingUrl: null, revision: 7 })
    const schedule = { specificDate: '2026-12-02', dayOfWeek: null, startTime: '19:00', endTime: '20:00' }
    assert.equal((await finalizeEvent('A/B', schedule)).meetingUrl, null)
    assert.deepEqual(requests, [
      { url: '/events/A%2FB/meeting-url', method: 'put', auth: 'Bearer host-token', body: { meetingUrl: 'https://meet.google.com/abc' } },
      { url: '/events/A%2FB/meeting-url', method: 'put', auth: 'Bearer host-token', body: { meetingUrl: null } },
      { url: '/events/A%2FB/finalize', method: 'post', auth: 'Bearer host-token', body: schedule },
    ])

    api.defaults.adapter = async (config) => {
      const response = { data: { isSuccess: false, code: 422, message: 'invalid', value: null }, status: 422, statusText: 'Unprocessable', headers: {}, config }
      throw new AxiosError('Invalid', AxiosError.ERR_BAD_REQUEST, config, null, response)
    }
    await assert.rejects(() => updateMeetingUrl('A/B', 'http://unsafe.example'), /Invalid information/)
  })
})

test('participants see one safe meeting room line and calendar action receives the current link', async () => {
  await withServer(async (load) => {
    const { MeetingRoomLine } = await load('/src/features/heatmap/components/MeetingRoomLine.tsx')
    const { MeetingRoomAction } = await load('/src/features/heatmap/components/MeetingRoomAction.tsx')
    const { AddToCalendarActions } = await load('/src/shared/components/AddToCalendarActions.tsx')
    const { mockDatesEvent } = await load('/tests/fixtures/heatmapEvent.ts')
    const url = 'https://meet.google.com/abc-defg-hij'
    const line = renderToStaticMarkup(createElement(MeetingRoomLine, { meetingUrl: url }))
    assert.match(line, /Meeting room: /)
    assert.match(line, /href="https:\/\/meet.google.com\/abc-defg-hij"/)
    assert.match(line, /rel="noopener noreferrer"/)
    assert.equal(renderToStaticMarkup(createElement(MeetingRoomLine, { meetingUrl: 'javascript:alert(1)' })), '')
    const participantAction = renderToStaticMarkup(createElement(MeetingRoomAction, { meetingUrl: url, mode: 'open' }))
    assert.match(participantAction, /href="https:\/\/meet.google.com\/abc-defg-hij"/)
    assert.match(participantAction, /Open meeting link/)
    assert.equal(renderToStaticMarkup(createElement(MeetingRoomAction, { meetingUrl: null, mode: 'copy' })), '')

    const event = {
      ...mockDatesEvent,
      status: 2,
      finalSchedule: { specificDate: mockDatesEvent.availableDates[0], dayOfWeek: null, startTime: '10:00', endTime: '11:00' },
      meetingUrl: url,
    }
    const withLink = renderToStaticMarkup(createElement(AddToCalendarActions, { event, source: 'overview' }))
    const withoutLink = renderToStaticMarkup(createElement(AddToCalendarActions, { event: { ...event, meetingUrl: null }, source: 'overview' }))
    assert.match(withLink, /meet.google.com/)
    assert.doesNotMatch(withoutLink, /meet.google.com/)
  })
})

test('event overview offers add/edit only to the host in both event states', async () => {
  await withServer(async (load) => {
    const { HeatmapPage } = await load('/src/features/heatmap/pages/HeatmapPage.tsx')
    const { mockDatesEvent } = await load('/tests/fixtures/heatmapEvent.ts')
    const render = (event, isAdmin) => renderToStaticMarkup(createElement(HeatmapPage, {
      event,
      isAdmin,
      onUpdateMeetingUrl: async () => undefined,
    }))
    const openHost = render(mockDatesEvent, true)
    const header = openHost.match(/<header[\s\S]*?<\/header>/)?.[0]
    assert.ok(header)
    assert.match(header, /Add Meeting Link/)
    assert.match(header, /Event code:/)
    assert.match(header, /aria-label="Copy link: DEMO26"/)
    assert.doesNotMatch(header, />Copy link</)
    assert.doesNotMatch(header, /Meeting room:/)
    assert.doesNotMatch(render(mockDatesEvent, false), /Add Meeting Link/)

    const finalized = {
      ...mockDatesEvent,
      status: 2,
      finalSchedule: { specificDate: mockDatesEvent.availableDates[0], dayOfWeek: null, startTime: '10:00', endTime: '11:00' },
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
    }
    const finalizedHost = render(finalized, true)
    assert.match(finalizedHost, /Edit Meeting Link/)
    assert.match(finalizedHost.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '', /Meeting room:[\s\S]*Copy meeting link/)
    const participant = render(finalized, false)
    assert.match(participant, /Meeting room: /)
    assert.doesNotMatch(participant, /Edit Meeting Link/)
  })
})

test('personal schedule places the meeting link before Select range and hides it when absent', async () => {
  await withServer(async (load) => {
    const { ScheduleActionsBar } = await load('/src/features/participants/components/ScheduleActionsBar.tsx')
    const url = 'https://meet.google.com/abc-defg-hij'
    const props = {
      grid: { isLocked: false, allSlotIds: new Set(), columns: [], rows: [], times: [] },
      triggerAutoSave: () => undefined,
      isSaving: false,
      onManualRangeApplied: () => undefined,
      googleImport: { canImport: false, isImporting: false, importFromGoogle: () => undefined, prepareImport: () => undefined },
    }
    const withLink = renderToStaticMarkup(createElement(ScheduleActionsBar, { ...props, meetingUrl: url }))
    const withoutLink = renderToStaticMarkup(createElement(ScheduleActionsBar, { ...props, meetingUrl: null }))
    assert.ok(withLink.indexOf('Meeting room:') < withLink.indexOf('Select range'))
    assert.match(withLink, /Open meeting link/)
    assert.doesNotMatch(withoutLink, /Meeting room:/)
  })
})
