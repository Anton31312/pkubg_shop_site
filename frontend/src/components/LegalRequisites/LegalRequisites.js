import React from 'react';
import { useLegalInfo } from '../../contexts/LegalInfoContext';

/**
 * Переиспользуемый блок реквизитов ИП.
 * Используется в Оферте, Контактах и т.д.
 */
const LegalRequisites = ({ showBank = false }) => {
  const { legalInfo } = useLegalInfo();

  return (
    <div className="legal-requisites">
      <p>
        {legalInfo.business_type}{" "}
        <strong>{legalInfo.full_name}</strong>
        <br />
        ОГРНИП: <strong>{legalInfo.ogrnip}</strong>
        <br />
        ИНН: <strong>{legalInfo.inn}</strong>
        <br />
        Адрес:{" "}
        <strong>
          {legalInfo.postal_code && `${legalInfo.postal_code}, `}
          {legalInfo.legal_address}
        </strong>

        {showBank && legalInfo.checking_account && (
          <>
            <br />
            Расчётный счёт: <strong>{legalInfo.checking_account}</strong>
            <br />
            Банк: <strong>{legalInfo.bank_name}</strong>
            <br />
            БИК: <strong>{legalInfo.bik}</strong>
            <br />
            Корр. счёт: <strong>{legalInfo.correspondent_account}</strong>
          </>
        )}

        <br />
        Email: <strong>{legalInfo.email}</strong>
        <br />
        Телефон: <strong>{legalInfo.phone}</strong>
      </p>
    </div>
  );
};

export default LegalRequisites;