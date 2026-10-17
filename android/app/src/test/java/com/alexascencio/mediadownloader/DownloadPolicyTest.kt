package com.alexascencio.mediadownloader
import org.junit.Assert.*
import org.junit.Test
class DownloadPolicyTest {
    @Test fun linkCompartilhadoRemoveRastreamento(){assertEquals("https://www.youtube.com/watch?v=Uw-_a0taISM",normalizarLink("Veja este vídeo https://youtu.be/Uw-_a0taISM?si=tracking"))}
    @Test fun naoConfundeHostImitador(){assertNull(youtubeId("https://youtube.com.evil.example/watch?v=Uw-_a0taISM"))}
    @Test fun shortsELive(){assertEquals("Uw-_a0taISM",youtubeId("https://m.youtube.com/shorts/Uw-_a0taISM"));assertEquals("Uw-_a0taISM",youtubeId("https://www.youtube.com/live/Uw-_a0taISM"))}
    @Test fun limiteNaoCaiEmQualidadeMaior(){val s=seletorFormato(Perfil.VIDEO_MAX,Qualidade.FULLHD);assertEquals("bv[height<=1080]+ba/b[height<=1080]",s)}
    @Test fun audioNaoFiltraAltura(){assertEquals("ba/b",seletorFormato(Perfil.AUDIO_MP3,Qualidade.HD))}
    @Test fun erro400NaoViraParedaoDeLog(){val m=erroAmigavel("WARNING: HTTP Error 400: Precondition check failed");assertTrue(m.contains("Atualizar motor"));assertFalse(m.contains("WARNING"))}
    @Test fun autenticacaoNaoPrometeContorno(){assertTrue(erroAmigavel("Please sign in").contains("autenticação"))}
    @Test(expected=IllegalArgumentException::class) fun protocoloInvalido(){normalizarLink("file:///etc/passwd")}
    @Test(expected=IllegalArgumentException::class) fun credenciaisRecusadas(){normalizarLink("https://user:password@example.org/video")}
}
