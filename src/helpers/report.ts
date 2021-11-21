import Context from '@/models/Context'
import bot from '@/helpers/bot'

const ignoredMessages = []

interface ExtraErrorInfo {
  ctx?: Context
  location?: string
  meta?: string
}

function constructErrorMessage(
  error: Error,
  { ctx, location, meta }: ExtraErrorInfo
) {
  const { message } = error
  const chatInfo = ctx ? [`Chat <b>${ctx.chat.id}</b>`] : []
  if (ctx && 'username' in ctx.chat) {
    chatInfo.push(`@${ctx.chat.username}`)
  }
  const result = `${
    location ? `<b>${escape(location)}</b>${ctx ? '\n' : ''}` : ''
  }${chatInfo.filter((v) => !!v).join(', ')}\n${escape(message)}${
    meta ? `${meta}\n` : ''
  }`
  return result
}

async function sendToTelegramAdmin(error: Error, info: ExtraErrorInfo) {
  try {
    if (
      process.env.ENVIRONMENT !== 'development' &&
      ignoredMessages.find((m) => error.message.includes(m))
    ) {
      return
    }
    const message = constructErrorMessage(error, info)
    await bot.api.sendMessage(process.env.ADMIN_ID, message, {
      parse_mode: 'HTML',
    })
    if (info.ctx) {
      await info.ctx.forwardMessage(process.env.ADMIN_ID)
    }
  } catch (sendError) {
    console.error('Error reporting:', sendError)
  }
}

export default function report(error: Error, info: ExtraErrorInfo = {}) {
  void sendToTelegramAdmin(error, info)
}

function escape(s: string) {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;')
}