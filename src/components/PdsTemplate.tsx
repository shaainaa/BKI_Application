import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 10 },
  logo: { width: 50, height: 35 },
  headerText: { marginLeft: 15 },
  title: { fontSize: 12, fontWeight: 'bold' },
  section: { marginTop: 20 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 110, fontWeight: 'bold' },
  colon: { width: 15 },
  value: { flex: 1, textTransform: 'uppercase' },
  footer: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  signBox: { textAlign: 'center', width: 180 },
  signatureImg: { width: 80, height: 45, alignSelf: 'center', marginVertical: 5 }
});

export const PdsTemplate = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image src="/images/BKI.png " style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>FORM PERMINTAAN PEMBUATAN PDS</Text>
          <Text style={styles.title}>CABANG UTAMA KLAS SURABAYA</Text>
        </View>
      </View>

      <View style={styles.section}>
        <DetailRow label="NAMA" value={data.user?.nama || 'N/A'} />
        <DetailRow label="UNTUK PERGI" value={data.lokasi} />
        <DetailRow label="KEPERLUAN" value={data.keperluan} />
        <DetailRow label="NO SO & SPS" value={data.noAgenda} />
        <DetailRow label="KEBERANGKATAN" value={`${data.tglBerangkat}                   JAM: ${data.jamBerangkat || '-'}`} />
        <DetailRow label="KEMBALI" value={`${data.tglKembali}                   JAM: ${data.jamKembali || '-'}`} />
        <DetailRow label="VISIT KE." value={`${data.visitKe}                                                            KETERANGAN VISIT: ${data.keteranganVisit}`} />
      </View>

      <Text style={{ marginTop: 30, marginRight: 50, textAlign: 'right' }}>Surabaya, {new Date(data.tanggalPengajuan).toLocaleDateString('id-ID')}</Text>

      <View style={styles.footer}>
        <View style={styles.signBox}>
          <Text>Mengetahui</Text>
          <Text>SM Operasi</Text>
          <View style={{ height: 60 }} />
          <Text style={{ borderBottomWidth: 1 }}>Ir. Agung Wicaksono</Text>
        </View>

        <View style={styles.signBox}>
          <Text>Pemohon / Surveyor</Text>
          {data.ttdDigitalUrl && <Image src={data.ttdDigitalUrl} style={styles.signatureImg} />}
          <Text style={{ borderBottomWidth: 1, marginTop: data.ttdDigitalUrl ? 15 : 50 }}>{data.user?.nama}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const DetailRow = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.colon}>:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);