/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Img,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>קוד האימות שלכם</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://easymorte.co.il/logo.png" alt="EASY MORTE" width="160" style={{ margin: '0 0 24px' }} />
        <Heading style={h1}>אימות זהות</Heading>
        <Text style={text}>השתמשו בקוד הבא כדי לאמת את הזהות שלכם:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          הקוד תקף לזמן מוגבל. אם לא ביקשתם אותו, אפשר להתעלם מהמייל הזה.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontFamily: 'Heebo, Arial, sans-serif',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(222, 47%, 15%)',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: 'hsl(220, 12%, 45%)', margin: '30px 0 0' }
