import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  url: string;
  host: string;
};

export function MagicLinkEmail({ url, host }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Acede ao painel da Reddune Solutions</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reddune Solutions</Heading>
          <Section style={section}>
            <Text style={text}>
              Olá,
            </Text>
            <Text style={text}>
              Recebeste este e-mail porque pediste acesso ao painel da Reddune Solutions.
              Clica no botão abaixo para entrar. Este link é válido por 24 horas e só pode ser usado uma vez.
            </Text>
            <Section style={buttonContainer}>
              <Button href={url} style={button}>
                Entrar no painel
              </Button>
            </Section>
            <Text style={smallText}>
              Se o botão não funcionar, copia e cola este endereço no teu navegador:
            </Text>
            <Text style={urlText}>{url}</Text>
            <Hr style={hr} />
            <Text style={footerText}>
              Se não pediste este acesso, ignora este e-mail. Ninguém entrará na tua conta.
            </Text>
          </Section>
          <Text style={footer}>
            {host} · Reddune Solutions
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#FAF7F4",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px 0 40px",
  borderRadius: "12px",
  border: "1px solid #e6ebf1",
  maxWidth: "560px",
};

const h1 = {
  color: "#9B1C1C",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "0.04em",
  textAlign: "center" as const,
  margin: "8px 0 28px",
};

const section = {
  padding: "0 40px",
};

const text = {
  color: "#1F1612",
  fontSize: "15px",
  lineHeight: "26px",
  textAlign: "left" as const,
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "28px 0 24px",
};

const button = {
  backgroundColor: "#9B1C1C",
  borderRadius: "8px",
  color: "#FAF7F4",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const smallText = {
  color: "#525f7f",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "20px 0 6px",
};

const urlText = {
  color: "#9B1C1C",
  fontSize: "12px",
  lineHeight: "18px",
  wordBreak: "break-all" as const,
  margin: "0 0 16px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
  margin: 0,
};

const footer = {
  color: "#8898aa",
  fontSize: "11px",
  textAlign: "center" as const,
  marginTop: "24px",
};
