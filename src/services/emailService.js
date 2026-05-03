import emailjs from '@emailjs/browser'

const SERVICE_ID = "service_6imoy9g"
const PUBLIC_KEY = "4Yzly6Ywi_6IlN9Bb"

export const sendApprovalEmail = async ({ studentEmail, studentName, eventName, eventDate, venue }) => {
  try {
    await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_APPROVED, {
      to_email: studentEmail,
      to_name: studentName,
      event_name: eventName,
      event_date: eventDate,
      venue,
    }, PUBLIC_KEY)
  } catch (err) {
    console.error('EmailJS approval error:', err)
  }
}

export const sendRejectionEmail = async ({ studentEmail, studentName, eventName }) => {
  try {
    await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_REJECTED, {
      to_email: studentEmail,
      to_name: studentName,
      event_name: eventName,
    }, PUBLIC_KEY)
  } catch (err) {
    console.error('EmailJS rejection error:', err)
  }
}

export const sendAdminNewRegistrationEmail = async ({ adminEmail, teamName, eventName, memberCount }) => {
  try {
    await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN, {
      to_email: adminEmail,
      team_name: teamName,
      event_name: eventName,
      member_count: memberCount,
    }, PUBLIC_KEY)
  } catch (err) {
    console.error('EmailJS admin notify error:', err)
  }
}

export const sendAdminCredentialsEmail = async ({ adminEmail, collegeName, password }) => {
  try {
    await emailjs.send(SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_CREDENTIALS, {
      to_email: adminEmail,
      college_name: collegeName,
      admin_email: adminEmail,
      password,
    }, PUBLIC_KEY)
  } catch (err) {
    console.error('EmailJS credentials error:', err)
  }
}
