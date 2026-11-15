/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>הזמנה להצטרף אל {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://easymorte.co.il/logo.png" alt="EASY MORTE" width="160" style={{ margin: '0 0 24px' }} />
        <Heading style={h1}>הזמנה להצטרף</Heading>
        <Text style={text}>
          הוזמנתם להצטרף אל{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . לחצו על הכפתור כדי לאשר את ההזמנה וליצור חשבון.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          אישור ההזמנה
        </Button>
        <Text style={footer}>
          אם לא ציפיתם להזמנה, אפשר להתעלם מהמייל הזה.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"IBM Plex Sans Hebrew", Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontFamily: 'Heebo, Arial, sans-serif',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(222, 47%, 15%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(220, 12%, 45%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(187, 85%, 36%)',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid hsl(187, 85%, 36%)',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(220, 12%, 45%)', margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: hsl(187, 85%, 36%) !important; color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: hsl(187, 85%, 36%) !important; color: #ffffff !important; }
  [data-ogsb] .dm-btn { background-color: hsl(187, 85%, 36%) !important; color: #ffffff !important; }
`
