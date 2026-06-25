import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ImageProcessorService } from '@/resources/media/image-processor.service';
import {
  MEDIA_MAIN_HEIGHT_PX,
  MEDIA_MAIN_WIDTH_PX,
  MEDIA_MAX_UPLOAD_BYTES,
  MEDIA_THUMB_PX,
} from '@/resources/media/media.constants';

const VALID_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const mockResize = jest.fn().mockReturnThis();
const mockToBuffer = jest.fn().mockResolvedValue(Buffer.from('webp-image'));

jest.mock('sharp', () => {
  const sharpMock = jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: mockResize,
    webp: jest.fn().mockReturnThis(),
    toBuffer: mockToBuffer,
  }));

  return {
    __esModule: true,
    default: sharpMock,
  };
});

function createFile(
  buffer: Buffer,
  mimetype = 'image/png',
  size = buffer.length,
): Express.Multer.File {
  return {
    buffer,
    mimetype,
    size,
    fieldname: 'file',
    originalname: 'avatar.png',
    encoding: '7bit',
    stream: null as never,
    destination: '',
    filename: '',
    path: '',
  };
}

/** @see FR-media-avatar-format */
describe('ImageProcessorService', () => {
  const service = new ImageProcessorService();

  beforeEach(() => {
    mockResize.mockClear();
    mockToBuffer.mockClear();
    mockToBuffer.mockResolvedValue(Buffer.from('webp-image'));
  });

  it('nominal: processes a valid PNG into 4:5 main and square thumb WebP buffers', async () => {
    const result = await service.processAvatarUpload(
      createFile(VALID_PNG_BUFFER),
    );

    expect(result.contentType).toBe('image/webp');
    expect(result.main).toEqual(Buffer.from('webp-image'));
    expect(result.thumb).toEqual(Buffer.from('webp-image'));
    expect(mockToBuffer).toHaveBeenCalledTimes(2);
    expect(mockResize).toHaveBeenNthCalledWith(
      1,
      MEDIA_MAIN_WIDTH_PX,
      MEDIA_MAIN_HEIGHT_PX,
      { fit: 'cover', position: 'centre' },
    );
    expect(mockResize).toHaveBeenNthCalledWith(2, MEDIA_THUMB_PX, MEDIA_THUMB_PX, {
      fit: 'cover',
      position: 'centre',
    });
  });

  it('failure: rejects uploads above the maximum size', async () => {
    await expect(
      service.processAvatarUpload(
        createFile(VALID_PNG_BUFFER, 'image/png', MEDIA_MAX_UPLOAD_BYTES + 1),
      ),
    ).rejects.toThrow(PayloadTooLargeException);
  });

  it('failure: rejects corrupted image bytes when sharp fails', async () => {
    mockToBuffer.mockRejectedValueOnce(
      new Error('Input buffer contains unsupported image format'),
    );

    await expect(
      service.processAvatarUpload(createFile(Buffer.from('not-an-image'))),
    ).rejects.toThrow(BadRequestException);
  });
});
