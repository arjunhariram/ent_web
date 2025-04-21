import React from 'react';
import '../styles/login_modal.css';

interface InvoiceModalProps {
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose }) => {
  const formatFilename = (filename: string) => {
    if (filename.length > 10) {
      return `${filename.substring(0, 10)}...pdf`;
    }
    return filename;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="invoice-modal-overlay" onClick={handleOverlayClick}>
      <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="invoice-modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="invoice-modal-header">Invoice Details</h2>
        <div className="invoice-modal-body">
          <table className="invoice-table">
            <tbody>
              <tr>
                <td>{formatFilename('WimbledonTicket.pdf')}</td>
                <td>2023-10-01</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('NetherlandsTour.pdf')}</td>
                <td>2023-10-05</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('USOpenTicket.pdf')}</td>
                <td>2023-09-15</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('FrenchOpenPass.pdf')}</td>
                <td>2023-08-20</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('CricketWorldCup.pdf')}</td>
                <td>2023-07-10</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('OlympicsPass.pdf')}</td>
                <td>2023-06-05</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('SuperBowlTicket.pdf')}</td>
                <td>2023-05-15</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('ConcertTicket.pdf')}</td>
                <td>2023-04-10</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('MoviePremiere.pdf')}</td>
                <td>2023-03-25</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('BroadwayShow.pdf')}</td>
                <td>2023-02-15</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('FootballMatch.pdf')}</td>
                <td>2023-01-30</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('BasketballGame.pdf')}</td>
                <td>2022-12-20</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('TennisFinals.pdf')}</td>
                <td>2022-11-10</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('HockeyLeague.pdf')}</td>
                <td>2022-10-05</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('GolfTournament.pdf')}</td>
                <td>2022-09-15</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('MarathonPass.pdf')}</td>
                <td>2022-08-25</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
              <tr>
                <td>{formatFilename('MusicFestival.pdf')}</td>
                <td>2022-07-10</td>
                <td style={{ paddingRight: '0px', width: '23px' }}>
                  <button className="invoice-download-button">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="invoice-modal-footer">
          <button className="invoice-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
