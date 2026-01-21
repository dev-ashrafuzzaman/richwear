import React from 'react';
import BalanceReportView from './BalanceReportView';

const CustomerBalance = () => {
    return (
        <div>
         <BalanceReportView type="customer" title="Customer" />
        </div>
    );
};

export default CustomerBalance;