import type { BlogCode, BlogImage, BlogProse, Post } from '../payload-types'
import { doc } from './richtext'

type SeedImage = Omit<BlogImage, 'image'> & { image: string }
export type SeedPost = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'cover' | 'sections'> & {
  cover?: string
  sections: { title: string; blocks: (BlogProse | BlogCode | SeedImage)[] }[]
}

/** Backticks in the authored prose become real inline-code nodes in Payload. */
const paragraph = (value: string) => ({
  type: 'paragraph', format: '', indent: 0, version: 1, direction: 'ltr', textFormat: 0,
  children: value.split(/(`[^`]+`)/g).filter(Boolean).map((part) => ({
    type: 'text', detail: 0, format: part.startsWith('`') ? 16 : 0,
    mode: 'normal', style: '', text: part.startsWith('`') ? part.slice(1, -1) : part, version: 1,
  })),
})

const prose = (...values: string[]): BlogProse => ({ blockType: 'prose', content: doc(...values.map(paragraph)) as BlogProse['content'] })
const code = (filename: string, language: BlogCode['language'], value: string, caption?: string): BlogCode => ({ blockType: 'code', filename, language, code: value.trim(), caption })
const image = (filename: string, caption: string): SeedImage => ({ blockType: 'image', image: filename, caption })

export const blogPosts: SeedPost[] = [
  {
    title: 'Bypassing Image Upload Filters with Magic Bytes and a Legacy PHP Handler: filtereous, JOINTS CTF 2026',
    slug: 'filtereous-image-upload-bypass-php2-handler',
    excerpt: 'How I built an upload challenge around a disagreement between filename validation, image signatures and Apache handler selection, and why an accepted image-looking file can still execute as PHP.',
    category: 'web', event: 'JOINTS CTF 2026', challenge: 'filtereous',
    tags: ['File upload', 'PHP', 'Apache', 'Magic bytes', 'CTF design'],
    cover: 'filtereous-burp-results.png',
    publishedAt: '2026-10-15T10:00:00.000Z', published: true,
    sections: [
      {
        title: 'Challenge Setup',
        blocks: [
          prose(
            'I made filtereous for JOINTS CTF 2026 as a deliberately small upload service. The interface accepts campaign assets, advertises only PNG, JPEG and GIF, and returns a public link after an upload passes its filters. There is no account system or long application workflow to reverse. The interesting behavior sits between the upload code and the server that publishes the result.',
            'The challenge draws on the file-upload attack patterns covered in Hack The Box Academy’s File Upload Attacks module. The specific combination here is my implementation: a final-extension allowlist, a short file-signature check, and an Apache rule that recognizes a legacy PHP extension in the middle of a filename.',
            'The intended question is not simply “can I get a PHP file accepted?” It is “which component decides that the accepted file is an image, and which component decides how to execute it?” Those two decisions use different parts of the same name.',
          ),
          code('The three decisions', 'text', `Upload name:      probe.php2.gif
Application:      final suffix is gif → allowed
Body inspection:  starts with GIF89a → allowed
Apache:           matches the configured .php2 rule → PHP`),
        ],
      },
      {
        title: 'The Two Upload Filters',
        blocks: [
          prose('The first filter uses the last extension returned by `pathinfo`. Earlier dots do not take part in the allowlist decision. For `probe.php2.gif`, the application sees `gif`, not `php2`.'),
          code('app/index.php · extension_allowed', 'php', String.raw`function extension_allowed(string $filename, array $allowedExtensions): bool
{
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    return in_array($extension, $allowedExtensions, true);
}`),
          prose('The second filter reads the first sixteen bytes of the temporary upload. It recognizes fixed prefixes and requires the prefix to agree with that final extension. This is more restrictive than trusting a browser-supplied Content-Type, but it is still only a prefix test.'),
          code('app/index.php · magic_matches_extension, excerpt', 'php', String.raw`$isPng = str_starts_with($prefix, "\x89PNG\r\n\x1a\n");
$isJpeg = str_starts_with($prefix, "\xff\xd8\xff");
$isGif = str_starts_with($prefix, 'GIF87a')
      || str_starts_with($prefix, 'GIF89a');

return match ($extension) {
    'png' => $isPng,
    'jpg' => $isJpeg,
    'gif' => $isGif,
    default => false,
};`, 'The file is not decoded as an image. Only its leading bytes are inspected.'),
          prose(
            'The order in the source is extension validation followed by this signature check. A plain `shell.php` is rejected by the name check. A PHP body renamed to `shell.png` fails the PNG prefix check. A GIF prefix attached to a final `.png` name also fails, because the body must match the final suffix.',
            'The multipart Content-Type field does not affect validation: `store_upload` never uses the client-provided MIME value to decide whether the upload is acceptable. Changing it does not create the execution primitive. The filename, the body prefix and the Apache rule do.',
          ),
        ],
      },
      {
        title: 'Vuln: Using Magic Bytes to Verify Images',
        blocks: [
          prose('For the GIF branch, the required prefix is six printable bytes. A minimal execution probe can put a PHP opening tag directly after them:'),
          code('An image-signature execution probe', 'php', String.raw`GIF89a<?php phpinfo(); ?>`, 'This satisfies the challenge’s GIF prefix test. It is not a claim that the result is a structurally valid GIF image.'),
          prose(
            'The prefix answers the upload filter’s question. The PHP opening tag answers a different question, but only if the web server dispatches the stored file to PHP. When that happens, PHP emits the bytes before its opening tag as ordinary output and then evaluates the code inside the tag. Seeing `GIF89a` before the generated output is therefore expected.',
            'I kept the name cleanup intentionally separate from that decision. It removes path components and restricts the alphabet, but allows dots. Storage adds a random prefix while preserving the rest of the original name. That prevents a predictable upload path from being necessary for the solve, but it does not remove a handler-relevant middle extension.',
          ),
          code('app/index.php · storage name', 'php', String.raw`$storedName = bin2hex(random_bytes(8)) . '-' . $originalName;
$destination = UPLOAD_DIR . '/' . $storedName;
move_uploaded_file((string)$file['tmp_name'], $destination);
return '/uploads/' . rawurlencode($storedName);`, 'Excerpt: the surrounding source also checks errors, applies the size limit and sets file permissions.'),
        ],
      },
      {
        title: 'PHP Execution Through .php2.gif',
        blocks: [
          prose('The other half of the challenge is explicit server configuration. It is not a universal rule that any file with two extensions executes as PHP. In this deployment, the upload directory has the following handler assignment:'),
          code('apache/filtereous.conf · upload directory', 'apacheconf', String.raw`<Directory /var/www/html/uploads>
    Options -Indexes -MultiViews
    AllowOverride None
    Require all granted

    <FilesMatch "\.php2(\..*)?$">
        SetHandler application/x-httpd-php
    </FilesMatch>
</Directory>`),
          prose(
            'The expression matches `.php2` followed either by the end of the name or by a dot and another suffix. A stored name ending in `.php2.gif` therefore selects the PHP handler even though the application approved it as a GIF. The random prefix does not affect this match.',
            'That distinction also explains why an accepted `probe.php.gif` is not a successful exploit in this configuration. The final GIF extension and the prefix can pass the application, yet the name still does not match this legacy handler rule. Acceptance and execution have to be tested separately.',
            'I made the executable middle extension the discovery step. The final image extension can stay constant while the middle extension is varied. Once `.php2` is identified, the same disagreement works with PNG or JPEG too, provided the body begins with the matching signature.',
          ),
        ],
      },
      {
        title: 'Finding .php2 with Burp Intruder',
        blocks: [
          prose('Burp Intruder can vary the filename components and multipart MIME field. Keeping the image signature consistent with the final suffix makes the results easier to interpret: otherwise a signature mismatch can hide a useful handler candidate.'),
          image('filtereous-burp-positions.png', 'Burp Intruder payload positions for the filename and multipart Content-Type.'),
          prose(
            'A `.php2.gif` candidate produces the “Asset accepted” notice and an upload link. The request body starts with `GIF89a`, which matches its final `.gif` suffix. The client MIME field shown in the request is not the reason it passes.',
            'The HTTP status column alone is not a success oracle. This application renders the upload page after both acceptance and rejection, normally with HTTP 200. The useful first-stage observation is the returned asset link; the second-stage test is a GET of that particular stored asset.',
          ),
          image('filtereous-burp-results.png', 'An accepted .php2.gif upload in Burp Intruder, with the returned asset URL.'),
          prose('Opening the accepted asset supplies the missing evidence. The PHP information page, preceded by the GIF marker, shows that the stored file was interpreted by PHP instead of merely being returned as static image bytes.'),
          image('filtereous-php-execution.png', 'The uploaded file executes as PHP, emitting the GIF89a prefix before phpinfo() output.'),
        ],
      },
      {
        title: 'Reading the Flag Through the Uploaded File',
        blocks: [
          prose(
            'My reference solve uses the same separation of stages. It creates a body with an image prefix, varies the middle extension, extracts the accepted upload URL, and fetches the result. The success condition is content returned after PHP execution, not just the upload page saying yes.',
            'A shell is unnecessary for the intended finish. The container places the challenge flag at `/flag.txt` and makes it readable by the web process. After the handler mismatch has been demonstrated, a direct read is enough:',
          ),
          code('The final GIF-prefixed body', 'php', String.raw`GIF89a<?php readfile('/flag.txt'); ?>`),
          prose(
            'The three parts of this body/name combination have independent jobs. The final `.gif` passes the extension allowlist. `GIF89a` passes the corresponding prefix check. The earlier `.php2` selects the server-side interpreter when the returned URL is opened. Removing any one of those conditions breaks this chain.',
            'This is also why I would not describe the bug as simply MIME spoofing. The MIME header is not trusted by this code in the first place. The failure is a disagreement between validation and execution, with shallow content inspection making it possible to satisfy both interpretations at once.',
          ),
        ],
      },
      {
        title: 'Fixing the Upload Configuration',
        blocks: [
          prose(
            'The lesson I built filtereous around is that “looks acceptable to the uploader” is weaker than “will only ever be served as inert content.” Each individual check can do exactly what its author intended while the combination is still unsafe.',
            'A meaningful correction has to close the execution boundary. Removing the legacy handler from the upload path, serving uploaded data from a genuinely static location, and generating names without preserving attacker-controlled suffixes all address that boundary. Decoding and re-encoding supported images addresses the separate weakness of treating a signature as proof of a complete image.',
            'Adding another MIME comparison would not repair this Apache rule. Nor would a longer list of blocked PHP-looking extensions establish the stronger property that uploaded content cannot select an interpreter. The useful design question is which component owns that property, and whether every route to the stored file preserves it.',
          ),
        ],
      },
    ],
    references: [
      { label: 'Hack The Box Academy: File Upload Attacks (challenge inspiration)', url: 'https://academy.hackthebox.com/module/details/136' },
      { label: 'Apache HTTP Server: FilesMatch', url: 'https://httpd.apache.org/docs/2.4/mod/core.html#filesmatch' },
      { label: 'Apache HTTP Server: SetHandler', url: 'https://httpd.apache.org/docs/2.4/mod/core.html#sethandler' },
      { label: 'PHP manual: pathinfo', url: 'https://www.php.net/manual/en/function.pathinfo.php' },
    ],
  },
  {
    title: 'Turning ACOPY Type Confusion into Arbitrary Read/Write and a GOT Overwrite: quokka, JOINTS CTF 2026',
    slug: 'quokka-acopy-type-confusion-got-overwrite',
    excerpt: 'Inside the tagged-word VM I built for JOINTS CTF: how a shared copy instruction confuses bytes with references, exposes object addresses, and makes a forged buffer a route to a writable GOT.',
    category: 'pwn', event: 'JOINTS CTF 2026', challenge: 'quokka',
    tags: ['VM exploitation', 'Type confusion', 'Heap', 'GOT overwrite', 'CTF design'],
    publishedAt: '2026-10-15T10:00:00.000Z', published: true,
    sections: [
      {
        title: 'quokka VM Overview',
        blocks: [
          prose(
            'I built quokka as a small stack-based bytecode VM. It reads a four-byte little-endian program length, reads exactly that many bytecode bytes, and executes the program using an operand stack and sixteen local slots. The handout contains the binary, libc and its loader; the source gives the clearest view of the contract each instruction is supposed to preserve.',
            'The ordinary array and buffer accessors check object kind and bounds. The interesting failure is in a shared copy operation. That makes the exercise about following representations through a helper, rather than finding a missing comparison in an obvious array access.',
            'The reference route I explain here does not need an adjacent heap object to land at a particular offset. It uses legal-sized copies to cross the VM’s representation boundary: a reference becomes readable bytes, and selected bytes become a reference. A forged object descriptor then turns the normal buffer instructions into a read/write primitive.',
          ),
          code('The reference chain', 'text', `ARRAY containing a reference
    → ACOPY into BUFFER → raw object address
    → fake header inside controlled bytes
    → ACOPY into ARRAY → forged reference
    → BGETW / BSETW through controlled data pointer
    → puts@GOT leak and overwrite
    → PRINT(buffer) calls system(buffer->data)`),
        ],
      },
      {
        title: 'Tagged Values and Object Layout',
        blocks: [
          prose('A value occupies one 64-bit word. Odd words represent integers; even words are treated as object references. Integer construction shifts the value left and sets the low bit. Object references are stored as their pointer bits.'),
          code('src/quokka.c · value helpers', 'c', `static inline int      is_int(uint64_t v) { return v & 1; }
static inline int      is_ref(uint64_t v) { return !(v & 1); }
static inline int64_t  to_int(uint64_t v) { return (int64_t)v >> 1; }
static inline uint64_t from_int(int64_t x){ return ((uint64_t)x << 1) | 1; }
static inline obj     *as_obj(uint64_t v) { return (obj *)(uintptr_t)v; }`),
          prose('A real object has a sixteen-byte header followed by its inline payload. The crucial detail is that `len` has different units for the two object kinds:'),
          code('src/quokka.c · object representation', 'c', `enum { T_ARRAY = 1, T_BUFFER = 2 };

typedef struct {
    uint32_t type;
    uint32_t len;   /* ARRAY: element count; BUFFER: byte count */
    void    *data;  /* points at the inline payload for real objects */
} obj;`),
          prose(
            'An array of length one owns eight payload bytes containing one tagged word. A buffer of length eight also owns eight payload bytes, but those bytes are not supposed to carry VM references. Their physical capacity can be identical while their meaning is different.',
            'The low-bit test does not prove that an even value names a genuine allocation. `pop_obj` checks that tag and casts the value to a pointer. This is workable only while every instruction preserves the distinction between raw byte data and trusted reference values. ACOPY is where that assumption stops holding.',
          ),
        ],
      },
      {
        title: 'Buffer Type and Bounds Checks',
        blocks: [
          prose('The byte and word buffer accessors are explicit about the object kind and byte range. For example, the word read checks that eight bytes fit from the requested offset:'),
          code('src/quokka.c · OP_BGETW', 'c', `case OP_BGETW: {
    int64_t idx = pop_int();
    obj *o = pop_obj();
    if (o->type != T_BUFFER) die("BGETW: not a buffer");
    if (idx < 0 || (uint64_t)idx + 8 > o->len)
        die("BGETW: out of bounds");
    uint64_t w;
    memcpy(&w, (uint8_t *)o->data + idx, 8);
    push(from_int((int64_t)w));
    break;
}`),
          prose(
            'For a real, uncorrupted buffer, those checks describe the allocation correctly. The corresponding write uses the same kind and range checks. Array access similarly insists on an array and an in-range element index.',
            'The exploitable assumption is earlier: the descriptor itself is trusted. If the VM accepts a pointer to attacker-controlled bytes as an object, a fake `type`, `len` and `data` can satisfy those checks without describing a genuine buffer allocation. The accessor can be locally consistent and still read or write somewhere completely different.',
          ),
        ],
      },
      {
        title: 'Vuln: Type Confusion and Overflow in ACOPY',
        blocks: [
          prose('Here is the shared operation as implemented. Both the source and destination are checked against the set of recognized object kinds. What is missing is a contract for which combinations are meaningful and which unit the length has.'),
          code('src/quokka.c · OP_ACOPY', 'c', `case OP_ACOPY: {
    int64_t n   = pop_int();
    obj    *dst = pop_obj();
    obj    *src = pop_obj();
    if (dst->type != T_ARRAY && dst->type != T_BUFFER)
        die("ACOPY: bad destination");
    if (src->type != T_ARRAY && src->type != T_BUFFER)
        die("ACOPY: bad source");
    if (n < 0 || (uint64_t)n > dst->len || (uint64_t)n > src->len)
        die("ACOPY: length out of range");
    memcpy(dst->data, src->data, (size_t)n * 8);
    break;
}`),
          prose(
            'There are two consequences. First, a buffer’s byte count is compared directly with a word count, but the eventual copy multiplies that count by eight. For a buffer, passing this comparison does not prove that the copied bytes fit.',
            'Second, even a physically in-bounds copy can move a raw word from a buffer into an array slot. Array slots are later consumed as tagged VM values. The reverse copy exposes the raw representation of a real reference. Merely checking that each operand has one of the two known type numbers does not preserve either of those invariants.',
            'The stack order is also worth keeping straight. The instruction pops the count, then destination, then source. Bytecode construction therefore pushes source, destination, count. An otherwise correct exploit can fail just by reversing those first two operands.',
          ),
        ],
      },
      {
        title: 'Leaking Heap Addresses Through ACOPY',
        blocks: [
          prose(
            'My reference solve first allocates a controlled buffer C. It stores the reference to C in an array with one element, then copies one word from that array into an eight-byte scratch buffer. Both payloads are eight bytes long; this part does not require an overflow.',
            'In the array, the word means “reference to C.” In the scratch buffer, the same bits are readable through BGETW as an integer. That is the address-of primitive. Adding the header size, sixteen, gives the address of C’s inline bytes.',
          ),
          code('solve/solve.py · address-of excerpt', 'python', `p += pushi(1) + NEWARR + store(ALEAK)
p += load(ALEAK) + pushi(0) + load(C) + ASET
p += pushi(8) + NEWBUF + store(BOUT)
p += load(ALEAK) + load(BOUT) + pushi(1) + ACOPY
p += load(BOUT) + pushi(0) + BGETW + pushi(16) + ADD + store(CDATA)`, 'Excerpt from my reference solver. The names are local-slot constants; each expression appends VM bytecode.'),
          prose('The VM’s tagged integer representation is not a transparent container for every possible 64-bit bit pattern. The heap and libc addresses used in this chain fit the representable positive range, so these address calculations round-trip through the integer operations used here.'),
        ],
      },
      {
        title: 'Forging a Buffer Object',
        blocks: [
          prose('C’s payload contains a fake descriptor. On this little-endian layout, the first eight-byte write packs the buffer type in the low 32 bits and a chosen length in the high 32 bits. The next write supplies the data pointer.'),
          code('solve/solve.py · controlled descriptor', 'python', `hdr_word0 = (FAKE_LEN << 32) | 2  # type=BUFFER, len=FAKE_LEN
p += pushi(32) + NEWBUF + store(C)
p += load(C) + pushi(0) + pushi(hdr_word0) + BSETW
p += load(C) + pushi(8) + pushi(puts_got) + BSETW`, 'The reference sets FAKE_LEN to 0x10000. C is still a normal 32-byte buffer; its payload holds the forged header.'),
          prose(
            'The address leaked in the previous step tells the program where that descriptor lives: C’s real header address plus sixteen. The solve writes this address into a scratch buffer, copies one word from that buffer into an array slot, and reads the slot back with AGET.',
            'That is the inverse conversion. Bytes under my control have become a VM reference. The pointer targets the fake header inside C, not C’s actual allocation header. Since there is no allocation-membership check at this boundary, the normal buffer handlers now accept this descriptor.',
          ),
          code('solve/solve.py · bytes-to-reference excerpt', 'python', `p += load(R) + pushi(0) + load(CDATA) + BSETW
p += pushi(1) + NEWARR + store(FFAKE)
p += load(R) + load(FFAKE) + pushi(1) + ACOPY
p += load(FFAKE) + pushi(0) + AGET + store(FAKEBUF)`, 'R is an eight-byte scratch buffer allocated earlier. This is another one-word copy, not an adjacent-object heap overwrite.'),
        ],
      },
      {
        title: 'Arbitrary Read/Write and GOT Overwrite',
        blocks: [
          prose(
            'The forged object claims to be a buffer, claims a large enough byte length, and points its data field at the selected address. A BGETW at offset zero now reads eight bytes from that address. A BSETW writes eight bytes there. In the reference chain, that selected address is the puts entry in the Global Offset Table.',
            'The build choices make that a deliberately direct finishing target. The handout is non-PIE, so its GOT location is fixed. The deployment build uses no RELRO and lazy binding, so the GOT entry is writable. NX is enabled, but the chain does not need to execute code from an injected buffer.',
          ),
          code('deploy/Dockerfile · compiler options', 'bash', String.raw`gcc -O1 -fno-stack-protector -no-pie -fno-pie \
    -Wl,-z,norelro -Wl,-z,lazy -o quokka quokka.c`),
          prose(
            'The banner in main calls puts before bytecode runs. That resolves the function early, so reading puts@GOT gives the libc function address rather than an unresolved lazy-binding target. With the matching libc from the handout, the displacement from puts to system is known.',
            'The VM has integer arithmetic and locals, so the leak does not have to leave the process for a second-stage calculation. The bytecode reads the resolved puts address, adds the symbol displacement and writes the resulting system address back to the same GOT slot.',
          ),
          code('The relocation calculation', 'text', `resolved_puts = *(uint64_t *)puts_got
system_addr   = resolved_puts + (libc_system_offset - libc_puts_offset)
*(uint64_t *)puts_got = system_addr`),
          prose('ASLR still moves libc. It does not change the displacement between these two symbols in the matching libc build. A writable target and a known module-relative displacement are the properties this finish relies on; the absence of a stack canary is not the primitive being used.'),
        ],
      },
      {
        title: 'Calling system() Through PRINT',
        blocks: [
          prose('The VM’s PRINT handler provides the call site. For a buffer value, it passes the data pointer to puts:'),
          code('src/quokka.c · OP_PRINT, reference branch', 'c', `obj *o = as_obj(v);
if (o->type == T_BUFFER)
    puts((char *)o->data);
else
    printf("<array len=%u>\\n", o->len);`),
          prose(
            'After the GOT overwrite, that existing call dispatches to system with the same first argument. Printing an ordinary buffer containing a null-terminated `/bin/sh` therefore invokes system on that string. The argument storage must be prepared before triggering the call, and the terminator matters because the destination function consumes a C string.',
            'The whole chain can be one bytecode program: construct the descriptor, reveal its address, manufacture the reference, read the GOT, calculate the replacement, overwrite it, and trigger PRINT. The program loader reads only the declared bytecode length, leaving subsequent stdin available to the invoked shell. That framing detail explains why a single submitted program can be followed by interactive input.',
            'There is no need for a ROP chain or executable heap data in this route. The exploit redirects a call that the interpreter already makes, after using its own instructions to corrupt the function pointer behind that call.',
          ),
        ],
      },
      {
        title: 'Alternative: Heap Overflow into an Adjacent Object',
        blocks: [
          prose(
            'Another way to forge a descriptor is to overflow a small buffer and overwrite a neighboring object’s metadata. This uses the byte-count mismatch in ACOPY.',
            'For example, a count of six passes a comparison against a buffer length of sixteen, but the copy is forty-eight bytes. Whether those extra bytes land on a useful neighboring descriptor depends on the allocation layout. A solver can arrange allocations and source bytes so that the next object ends up claiming a chosen type, length and data pointer.',
            'My reference route avoids that heap-adjacency dependency by moving a single word between arrays and buffers. Both approaches are consequences of treating object lengths and payload representations as interchangeable. The important observation as a setter is that fixing only the overflowing byte count would still leave the bytes-to-reference conversion available.',
          ),
        ],
      },
      {
        title: 'Fixing ACOPY Type and Length Checks',
        blocks: [
          prose('The natural repair is to stop treating one generic copy helper as if byte buffers and reference-bearing arrays had the same contract. An array-word copy can require arrays on both sides and compare element counts before scaling by the word size:'),
          code('An array-only copy contract', 'c', `if (src->type != T_ARRAY || dst->type != T_ARRAY)
    die("array copy requires arrays");
if (n < 0 || (uint64_t)n > src->len || (uint64_t)n > dst->len)
    die("array copy out of bounds");
memcpy(dst->data, src->data, (size_t)n * sizeof(uint64_t));`, 'A repair sketch, not part of the challenge source. Buffer copies should be a separate byte-counted operation.'),
          prose(
            'For buffers, the length check and memcpy size should both be expressed in bytes. Cross-kind conversion must not be a raw copy that can mint references from attacker-selected data. If a conversion is a real language feature, it needs an explicit representation and validation rule.',
            'The point of quokka is that the visible bounds check is not the entire safety argument. The unit of a length, the provenance of a reference and the trust placed in an object descriptor all have to agree across every instruction. ACOPY breaks that agreement, and the remaining checked instructions then carry the exploit the rest of the way.',
          ),
        ],
      },
    ],
    references: [
      { label: 'Linux manual: memcpy', url: 'https://man7.org/linux/man-pages/man3/memcpy.3.html' },
      { label: 'GNU linker options: RELRO and lazy binding', url: 'https://sourceware.org/binutils/docs/ld/Options.html' },
      { label: 'GCC link options: PIE and non-PIE executables', url: 'https://gcc.gnu.org/onlinedocs/gcc/Link-Options.html' },
    ],
  },
]
